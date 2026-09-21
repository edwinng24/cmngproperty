"use client";

import { useState } from "react";
import { site } from "@/lib/site";

type Status = "idle" | "submitting" | "success" | "error";

const fieldClass =
  "mt-1.5 block w-full rounded-lg border border-brand-900/15 bg-white px-3.5 py-2.5 text-sm text-brand-950 placeholder:text-ink-500 focus:border-accent-500 focus:outline-none";

const labelClass = "block text-sm font-medium text-brand-900";

/** Marks the fields the API rejects when blank. */
function Required() {
  return (
    <span className="text-red-600" aria-hidden>
      {" "}
      *
    </span>
  );
}

const enquiryPlaceholder = "Select one";

const enquiryOptions = [
  "Owner — looking for management",
  "Owner — already with CMNG",
  "Current resident",
  "Prospective resident",
  "Something else",
];

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("submitting");
    setError("");

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);

      // `ok` in the body, not response.ok: delivery failures come back as
      // HTTP 200 so their message survives the CDN. Treating a 2xx as success
      // here would show "thanks" for an enquiry that was never sent.
      if (response.ok && body?.ok === true) {
        form.reset();
        setStatus("success");
        return;
      }

      setError(body?.error || "That did not go through. Please try again.");
      setStatus("error");
    } catch {
      setError("Network error — check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-xl border border-brand-200 bg-brand-50 p-8 text-center"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="mx-auto h-11 w-11 text-brand-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12.2 2.4 2.4 4.6-5.2" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-brand-900">
          Thanks — we have your message.
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          We reply to every enquiry within one business day. If it is urgent,
          email{" "}
          <a
            className="font-medium underline underline-offset-2"
            href={`mailto:${site.email}?subject=URGENT`}
          >
            {site.email}
          </a>{" "}
          with URGENT in the subject line.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-5 text-sm font-semibold text-accent-700 underline underline-offset-4"
        >
          Send another message
        </button>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Honeypot: hidden from people, tempting to bots. */}
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="name">
            Name
            <Required />
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={fieldClass}
            placeholder="Jordan Ellis"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="email">
            Email
            <Required />
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={fieldClass}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="phone">
            Your phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={fieldClass}
            placeholder="If you would rather we call you"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="enquiry">
            I am a
          </label>
          <select
            id="enquiry"
            name="enquiry"
            defaultValue=""
            className={fieldClass}
          >
            <option value="" disabled>
              {enquiryPlaceholder}
            </option>
            {enquiryOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="property">
          Property address
        </label>
        <input
          id="property"
          name="property"
          type="text"
          className={fieldClass}
          placeholder="Street, city"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="message">
          How can we help?
          <Required />
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className={fieldClass}
          placeholder="Tell us about the property, the timeline, and anything we should know."
        />
      </div>

      {status === "error" && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-lg bg-accent-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send message"}
        </button>
        <p className="text-xs text-ink-500">
          <span className="text-red-600">*</span> required · we reply within one
          business day.
        </p>
      </div>
    </form>
  );
}
