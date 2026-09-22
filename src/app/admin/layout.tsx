import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { currentAdmin } from "@/lib/auth";
import { isConfigured } from "@/lib/db";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: "Admin",
  // Never index the admin tool, even the login page.
  robots: { index: false, follow: false },
};

// Every admin page reads the session cookie and live data, so none of it can
// be prerendered.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Without a database every admin page would throw a connection error on
  // load. Say what is missing instead — the rest of the site works fine
  // without it, so this is a likely state on a fresh deploy.
  if (!isConfigured()) {
    return (
      <div className="min-h-screen bg-sand-50">
        <Container className="py-20">
          <div className="mx-auto max-w-xl rounded-2xl border border-brand-900/10 bg-white p-8">
            <h1 className="text-2xl font-semibold text-ink-900">
              Database not configured
            </h1>
            <p className="mt-3 leading-relaxed text-ink-700">
              The admin tool needs <code className="font-mono text-sm">DB_USER</code>{" "}
              and <code className="font-mono text-sm">DB_NAME</code> in{" "}
              <code className="font-mono text-sm">.env.local</code>, then:
            </p>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-brand-950 p-4 text-xs text-brand-100">
{`node scripts/migrate.mjs
node scripts/create-admin.mjs "Your Name" you@example.com`}
            </pre>
            <p className="mt-4 text-sm text-ink-600">
              See the &ldquo;Rental applications&rdquo; section of the README.
              The rest of the site runs without this.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  // Not requireAdmin(): the login page lives inside this layout and would
  // redirect to itself forever. Individual pages gate themselves.
  const admin = await currentAdmin();

  return (
    <div className="min-h-screen bg-sand-50">
      <header className="border-b border-brand-900/10 bg-white">
        <Container className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold text-brand-900">
              Admin
            </Link>
            {admin && (
              <nav className="flex gap-4 text-sm">
                <Link href="/admin" className="text-ink-600 hover:text-brand-800">
                  Properties
                </Link>
                <Link
                  href="/admin/applications"
                  className="text-ink-600 hover:text-brand-800"
                >
                  Applications
                </Link>
                <Link href="/" className="text-ink-600 hover:text-brand-800">
                  View site
                </Link>
              </nav>
            )}
          </div>
          {admin && (
            <form action={logoutAction} className="flex items-center gap-3">
              <span className="hidden text-sm text-ink-500 sm:inline">
                {admin.email}
              </span>
              <button
                type="submit"
                className="rounded-md border border-brand-900/15 px-3 py-1.5 text-sm text-ink-700 hover:border-brand-700"
              >
                Sign out
              </button>
            </form>
          )}
        </Container>
      </header>
      <Container className="py-10">{children}</Container>
    </div>
  );
}
