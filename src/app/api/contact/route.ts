import { NextResponse } from "next/server";
import { FROM, TO, esc, logMailConfig, sendMail } from "@/lib/mailer";

/**
 * Contact form endpoint. Every submission is emailed to the address the mailer
 * resolves (info@cmngproperty.com unless CONTACT_TO says otherwise), with
 * Reply-To set to the sender so replying answers the enquirer directly.
 *
 * Delivery lives in src/lib/mailer.ts, shared with rental applications.
 */

export const runtime = "nodejs";

logMailConfig();

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
    const delivery = await sendMail({
      subject: `Website enquiry — ${data.name}`,
      text: asText(data),
      html: asHtml(data),
      replyTo: `${data.name} <${data.email}>`,
    });
    return NextResponse.json({ ok: true, delivery });
  } catch (cause) {
    console.error("[contact] delivery failed", cause);
    const text = cause instanceof Error ? cause.message : String(cause);
    if (/\b(550|553)\b/.test(text) && /domain|sender|from/i.test(text)) {
      console.error(
        `[contact] the relay refused the sender "${FROM}". SMTP_FROM must be ` +
          "an address on a domain verified with your provider.",
      );
    }
    // Deliberately HTTP 200 with ok:false. A 5xx gets intercepted by
    // Cloudflare, which swaps our JSON for its own error page — so the visitor
    // saw a generic "try again" instead of being told to email us. The client
    // keys off `ok`, not the status code.
    return NextResponse.json({
      ok: false,
      error: `We could not send that. Please email ${TO} directly.`,
    });
  }
}
