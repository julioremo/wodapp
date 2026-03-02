import { fail } from "@sveltejs/kit";
import { zod4 as zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { gymSettingsSchema } from "$lib/schemas/settings";

export const load = async ({ locals }) => {
  const settingsData = locals.location?.settings || {};

  const form = await superValidate(settingsData, zod(gymSettingsSchema));

  return { form };
};

export const actions = {
  default: async ({ request, locals }) => {
    if (!locals.userRole || !["admin", "manager"].includes(locals.userRole)) {
      return fail(403, { message: "Unauthorized." });
    }

    // Superforms automatically handles parsing the JSON payload here
    const form = await superValidate(request, zod(gymSettingsSchema));

    if (!form.valid) {
      console.log("SERVER VALIDATION FAILED:", form.errors);
      return fail(400, { form });
    }

    console.log("PAYLOAD VALID. SENDING TO DB:", form.data);

    console.log("ATTEMPTING TO UPDATE LOCATION ID:", locals.location?.id);

    const { data: updatedRows, error } = await locals.supabase
      .from("locations")
      .update({ settings: form.data })
      .eq("id", locals.location?.id)
      .select();

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return fail(500, { form, message: "Internal server error." });
    }

    if (!updatedRows || updatedRows.length === 0) {
      console.error("SILENT FAILURE: 0 rows updated. Check RLS policies or ID mismatch.");
      return fail(403, { form, message: "Permission denied or location not found by database." });
    }

    console.log("SUCCESSFULLY UPDATED:", updatedRows);

    return { form, success: true };
  }
};
