import { fail } from "@sveltejs/kit";
import { zod4 as zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { bookingPoliciesSchema } from "$lib/schemas/settings";

export const load = async ({ parent }) => {
  const { settings } = await parent();

  return {
    form: await superValidate(settings, zod(bookingPoliciesSchema))
  };
};

export const actions = {
  default: async ({ request, locals }) => {
    // The auth check is already handled by the layout load function,
    // but we still need to verify the location ID for the database update
    if (!locals.location?.id) {
      return fail(400, { message: "Location ID missing." });
    }

    const form = await superValidate(request, zod(bookingPoliciesSchema));
    if (!form.valid) return fail(400, { form });

    const existingSettings = locals.location.settings || {};

    // Spread merge specifically for this namespace
    const mergedSettings = { ...existingSettings, ...form.data };

    const { error } = await locals.supabase
      .from("locations")
      .update({ settings: mergedSettings })
      .eq("id", locals.location.id);

    if (error) return fail(500, { form, message: "Internal server error." });

    return { form };
  }
};
