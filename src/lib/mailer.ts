import "server-only";
import nodemailer from "nodemailer";
import { site } from "./site";

/**
 * Outbound mail, shared by the contact form and rental applications.
 *
 * Delivery is pluggable and picked at runtime from whatever is configured:
 *   1. SMTP_HOST + SMTP_USER + SMTP_PASS — plain SMTP via nodemailer
 *   2. MAILGUN_API_KEY + MAILGUN_DOMAIN  — Mailgun HTTP API
 *   3. RESEND_API_KEY                    — Resend
 *
 * SMTP is the path the sibling sites on this server use, with Mailtrap as the
 * relay. There is no provider SDK involved: everything provider-specific is
 * configuration, so the same variables point at Mailtrap, Google Workspace or
 * anything else that speaks SMTP.
 */

/**
 * Reads an env var, treating blank as unset.
 *
 * `process.env.X ?? fallback` is not enough: a bare `CONTACT_TO=` line in an
 * .env file yields "", which is neither null nor undefined, so it wins the
 * ?? and the fallback never runs. That shipped once and cost a production
 * outage — nodemailer failed with "No recipients defined".
 */
export function env(name: string): string | undefined {
  const v = process.env[name];
  return v !== undefined && v.trim() !== "" ? v.trim() : undefined;
}

/** Where notifications land. */
export const TO = env("CONTACT_TO") ?? env("ADMIN_EMAIL") ?? site.email;

/**
 * Envelope sender. Never SMTP_USER: on Mailtrap's live relay that value is the
 * literal string "api", and `From: api` is rejected outright. This must be a
 * real address on a domain verified with the provider.
 */
export const FROM =
  env("SMTP_FROM") ?? env("CONTACT_FROM") ?? env("ADMIN_EMAIL") ??
  `${site.name} <${TO}>`;

export type Mail = {
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  to?: string;
};

async function viaSmtp(mail: Mail): Promise<string> {
  const port = Number(env("SMTP_PORT") ?? 587);
  // SMTP_SECURE, when set, wins. Otherwise infer: 465 is implicit TLS, while
  // 587 and 25 open in plaintext and upgrade via STARTTLS.
  const secure =
    env("SMTP_SECURE") !== undefined ? env("SMTP_SECURE") === "true" : port === 465;

  const transport = nodemailer.createTransport({
    host: env("SMTP_HOST")!,
    port,
    secure,
    auth: env("SMTP_USER")
      ? { user: env("SMTP_USER")!, pass: env("SMTP_PASS") ?? "" }
      : undefined,
  });

  await transport.sendMail({
    from: FROM,
    to: mail.to ?? TO,
    replyTo: mail.replyTo,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
  return "smtp";
}

async function viaMailgun(mail: Mail): Promise<string> {
  const domain = env("MAILGUN_DOMAIN");
  if (!domain) throw new Error("MAILGUN_API_KEY is set but MAILGUN_DOMAIN is not");
  // EU-region accounts must set MAILGUN_BASE_URL=https://api.eu.mailgun.net —
  // a EU key against the US endpoint fails with a 401 that looks like a bad
  // key rather than a wrong region.
  const base = env("MAILGUN_BASE_URL") ?? "https://api.mailgun.net";

  const form = new URLSearchParams({
    from: FROM,
    to: mail.to ?? TO,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    "o:tag": "cmngproperty",
  });
  if (mail.replyTo) form.set("h:Reply-To", mail.replyTo);

  const res = await fetch(`${base}/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      // Mailgun uses HTTP Basic with the literal username "api".
      Authorization: `Basic ${Buffer.from(`api:${env("MAILGUN_API_KEY")}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  if (!res.ok) throw new Error(`Mailgun responded ${res.status}: ${await res.text()}`);
  return "mailgun";
}

async function viaResend(mail: Mail): Promise<string> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [mail.to ?? TO],
      reply_to: mail.replyTo,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    }),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
  return "resend";
}

/**
 * Sends, returning the provider used.
 *
 * With nothing configured, development logs and reports success so the site
 * works on a fresh clone; production throws, because a form that silently
 * swallows submissions is worse than one that admits it is not wired up.
 */
export async function sendMail(mail: Mail): Promise<string> {
  if (env("SMTP_HOST")) return viaSmtp(mail);
  if (env("MAILGUN_API_KEY")) return viaMailgun(mail);
  if (env("RESEND_API_KEY")) return viaResend(mail);

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "No delivery method configured (SMTP_HOST, MAILGUN_API_KEY or RESEND_API_KEY)",
    );
  }
  console.warn(
    `[mail] nothing configured — would have sent to ${mail.to ?? TO}:\n` +
      `Subject: ${mail.subject}\n${mail.text}`,
  );
  return "logged";
}

/** Escapes text for interpolation into the HTML bodies below. */
export const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** One-time startup report, so misconfiguration shows up in the logs. */
export function logMailConfig(): void {
  if (env("SMTP_HOST")) {
    console.log(
      `[mail] SMTP ${env("SMTP_HOST")}:${env("SMTP_PORT") ?? 587} ` +
        `secure=${env("SMTP_SECURE") ?? "(inferred)"} user=${env("SMTP_USER")} ` +
        `pass=${(process.env.SMTP_PASS ?? "").length} chars | from=${FROM} to=${TO}`,
    );
    const explicit =
      env("SMTP_FROM") ?? env("CONTACT_FROM") ?? env("ADMIN_EMAIL");
    if (!explicit) {
      console.warn(
        `[mail] SMTP_FROM is not set, so mail will be sent as ${FROM}. ` +
          "The relay will reject this unless that domain is verified with it.",
      );
    }
  } else if (env("MAILGUN_API_KEY")) {
    console.log(`[mail] Mailgun domain=${env("MAILGUN_DOMAIN")} from=${FROM} to=${TO}`);
  } else if (env("RESEND_API_KEY")) {
    console.log(`[mail] Resend from=${FROM} to=${TO}`);
  } else {
    console.warn("[mail] no delivery method configured");
  }
}
