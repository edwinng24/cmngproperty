"use server";

import { requireAdmin } from "@/lib/auth";
import { getApplicationSsns } from "@/lib/applications";

/**
 * Decrypts the SSNs for one application.
 *
 * Deliberately a separate action rather than part of the page load: opening an
 * application should not decrypt one, and this way every reveal is an explicit
 * act by a signed-in admin that shows up in the server log.
 */
export async function revealSsnsAction(applicationId: number): Promise<string[]> {
  const admin = await requireAdmin();
  console.log(
    `[audit] ${admin.email} revealed SSNs for application ${applicationId}`,
  );
  return getApplicationSsns(applicationId);
}
