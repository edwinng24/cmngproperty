import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { site } from "@/lib/site";

/**
 * Contact form endpoint. Every submission is emailed to `site.email`
 * (info@cmngproperty.com) — override with CONTACT_TO if it should go
 * somewhere else.
 *
 * Delivery is pluggable and picked at runtime from whatever is configured:
 *   1. SMTP_HOST + SMTP_USER + SMTP_PASS — sends through your own mailbox
 *   2. RESEND_API_KEY                    — sends via Resend
 *   3. FORMSPREE_ID                      — forwards to a Formspree form
 *
 * With none of them set, development logs the enquiry to the server and
 * returns success so the form is usable on a fresh clone. Production instead
 * returns an error, because a form that silently swallows enquiries is worse
 * than one that admits it is not wired up.
 */

export const runtime = "nodejs";

/** Where enquiries land. */
const TO = process.env.CONTACT_TO ?? site.email;

type Payload = {
  name: string;
  email: string;
  phone: string;
  enquiry: string;
  property: string;
  message: string;
};

const MAX = { name: 120, email: 200, phone: 40, property: 200, message: 5000 };

// Naive fixed-window limit, enough to blunt casual abuse on a single instance.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validate(body: Record<string, unknown>) {
  const data: Payload = {
    name: clean(body.name, MAX.name),
    email: clean(body.email, MAX.email),
    phone: clean(body.phone, MAX.phone),
    enquiry: clean(body.enquiry, 80),
    property: clean(body.property, MAX.property),
    message: clean(body.message, MAX.message),
  };

  const errors: string[] = [];
  if (!data.name) errors.push("Please tell us your name.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email))
    errors.push("Please enter a valid email address.");
  if (data.message.length < 10)
    errors.push("Please add a little more detail to your message.");

  return { data, errors };
}

function asText(d: Payload) {
  return [
    `Name:     ${d.name}`,
    `Email:    ${d.email}`,
    `Phone:    ${d.phone || "—"}`,
    `Enquiry:  ${d.enquiry || "—"}`,
    `Property: ${d.property || "—"}`,
    "",
    d.message,
  ].join("\n");
}

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function asHtml(d: Payload) {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:4px 14px 4px 0;color:#5f7168">${k}</td>` +
    `<td style="padding:4px 0;color:#0f1f1a"><strong>${esc(v || "—")}</strong></td></tr>`;
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.55">
  <h2 style="margin:0 0 14px;color:#0c523b">Website enquiry</h2>
  <table style="border-collapse:collapse;margin-bottom:18px">
    ${row("Name", d.name)}${row("Email", d.email)}${row("Phone", d.phone)}
    ${row("Enquiry", d.enquiry)}${row("Property", d.property)}
  </table>
  <div style="white-space:pre-wrap;padding:14px 16px;background:#eef7f2;border-left:3px solid #8a2f4b;color:#2d413a">${esc(d.message)}</div>
</div>`;
}

async function sendViaSmtp(d: Payload) {
  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host,
    port,
    // 465 is implicit TLS; 587 and 25 start plaintext and upgrade via STARTTLS.
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" }
      : undefined,
  });

  await transport.sendMail({
    // Must be a mailbox the SMTP account is allowed to send as, otherwise the
    // server will reject it or the message will fail SPF at the far end.
    from: process.env.CONTACT_FROM ?? `${site.name} <${TO}>`,
    to: TO,
    replyTo: `${d.name} <${d.email}>`,
    subject: `Website enquiry — ${d.name}`,
    text: asText(d),
    html: asHtml(d),
  });
  return "smtp";
}

async function sendViaResend(d: Payload) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM ?? `${site.name} <onboarding@resend.dev>`,
      to: [TO],
      reply_to: `${d.name} <${d.email}>`,
      subject: `Website enquiry — ${d.name}`,
      text: asText(d),
      html: asHtml(d),
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
  }
  return "resend";
}

async function sendViaFormspree(d: Payload) {
  const res = await fetch(`https://formspree.io/f/${process.env.FORMSPREE_ID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ...d, _replyto: d.email }),
  });
  if (!res.ok) throw new Error(`Formspree responded ${res.status}`);
  return "formspree";
}

async function deliver(d: Payload) {
  if (process.env.SMTP_HOST) return sendViaSmtp(d);
  if (process.env.RESEND_API_KEY) return sendViaResend(d);
  if (process.env.FORMSPREE_ID) return sendViaFormspree(d);

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "No delivery method configured (SMTP_HOST, RESEND_API_KEY or FORMSPREE_ID)",
    );
  }
  console.warn(
    `[contact] No delivery configured — would have emailed ${TO}:\n${asText(d)}`,
  );
  return "logged";
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many messages. Please try again in a minute." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  // Honeypot: only bots fill this in.
  if (clean(body._gotcha, 100)) {
    return NextResponse.json({ ok: true, delivery: "discarded" });
  }

  const { data, errors } = validate(body);
  if (errors.length) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 422 });
  }

  try {
    const delivery = await deliver(data);
    return NextResponse.json({ ok: true, delivery });
  } catch (cause) {
    console.error("[contact] delivery failed", cause);
    return NextResponse.json(
      { error: `We could not send that. Please email ${TO} directly.` },
      { status: 502 },
    );
  }
}
