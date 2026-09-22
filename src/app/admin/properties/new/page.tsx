import { PropertyForm } from "@/components/PropertyForm";
import { requireAdmin } from "@/lib/auth";
import { createPropertyAction } from "../../actions";

export default async function NewProperty() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-brand-900/10 bg-white p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
        Add a property
      </h1>
      <p className="mt-1 text-sm text-ink-600">
        Its application form goes live at once, unless you untick
        &ldquo;accepting applications&rdquo;.
      </p>
      <div className="mt-8">
        <PropertyForm
          action={createPropertyAction}
          submitLabel="Add property"
          values={{ screening_fee: "30", is_active: true }}
        />
      </div>
    </div>
  );
}
