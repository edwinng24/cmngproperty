import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { currentAdmin } from "@/lib/auth";
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
