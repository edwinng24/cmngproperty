"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { login, logout, requireAdmin } from "@/lib/auth";
import {
  createProperty,
  deleteProperty,
  parseMoneyToCents,
  updateProperty,
  type PropertyInput,
} from "@/lib/properties";
import { updateApplicationStatus } from "@/lib/applications";
import { STATUSES } from "@/lib/statuses";

export type ActionState = { error?: string } | undefined;

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const h = await headers();
  const user = await login(email, password, {
    ip: h.get("x-forwarded-for")?.split(",")[0].trim(),
    userAgent: h.get("user-agent") ?? undefined,
  });
  // One message for both causes: saying which was wrong tells an attacker
  // which addresses are real.
  if (!user) return { error: "Those details did not match an account." };
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/admin/login");
}

function readProperty(formData: FormData): PropertyInput | string {
  const get = (k: string) => String(formData.get(k) ?? "").trim();

  const address_line1 = get("address_line1");
  const city = get("city");
  const region = get("region");
  const postal = get("postal");
  const rent = parseMoneyToCents(get("monthly_rent"));

  if (!address_line1) return "Street address is required.";
  if (!city) return "City is required.";
  if (!region) return "State is required.";
  if (!postal) return "Zip code is required.";
  if (rent === null) return "Enter a valid monthly rent.";

  const decimal = (k: string) => {
    const v = get(k);
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? v : null;
  };

  return {
    slug: get("slug") || undefined,
    address_line1,
    address_line2: get("address_line2") || null,
    city,
    region,
    postal,
    monthly_rent_cents: rent,
    deposit_cents: parseMoneyToCents(get("deposit")),
    credit_check_fee_cents: parseMoneyToCents(get("credit_check_fee")),
    other_charges_cents: parseMoneyToCents(get("other_charges")),
    other_charges_label: get("other_charges_label") || null,
    screening_fee_cents: parseMoneyToCents(get("screening_fee")) ?? 3000,
    bedrooms: decimal("bedrooms"),
    bathrooms: decimal("bathrooms"),
    available_from: get("available_from") || null,
    description: get("description") || null,
    is_active: formData.get("is_active") === "on" ? 1 : 0,
  };
}

export async function createPropertyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const input = readProperty(formData);
  if (typeof input === "string") return { error: input };
  await createProperty(input);
  revalidatePath("/admin");
  revalidatePath("/apply");
  redirect("/admin");
}

export async function updatePropertyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Unknown property." };
  const input = readProperty(formData);
  if (typeof input === "string") return { error: input };
  await updateProperty(id, input);
  revalidatePath("/admin");
  revalidatePath("/apply");
  redirect("/admin");
}

export async function deletePropertyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Unknown property." };
  const result = await deleteProperty(id);
  if (!result.ok) return { error: result.reason };
  revalidatePath("/admin");
  revalidatePath("/apply");
  redirect("/admin");
}

export async function updateApplicationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  if (!Number.isInteger(id)) return { error: "Unknown application." };
  if (!(STATUSES as readonly string[]).includes(status))
    return { error: "Unknown status." };
  await updateApplicationStatus(
    id,
    status,
    String(formData.get("admin_notes") ?? "").trim() || null,
  );
  revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/admin/applications");
  return { error: undefined };
}
