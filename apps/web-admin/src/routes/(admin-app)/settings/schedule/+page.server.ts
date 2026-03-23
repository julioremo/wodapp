import { fail } from "@sveltejs/kit";
import { zod4 as zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { schedulePreferencesSchema } from "@wodapp/core";

export const load = async ({ parent }) => {
  const { settings } = await parent();

  const form = await superValidate(settings, zod(schedulePreferencesSchema));

  return { form };
};

export const actions = {
  default: async ({ request, locals }) => {
    if (!locals.location?.id) {
      return fail(400, { message: "Location ID missing." });
    }

    const form = await superValidate(request, zod(schedulePreferencesSchema));
    if (!form.valid) return fail(400, { form });

    const existingSettings = locals.location.settings || {};
    const mergedSettings = { ...existingSettings, ...form.data };

    const { error } = await locals.supabase
      .from("locations")
      .update({ settings: mergedSettings })
      .eq("id", locals.location.id);

    if (error) return fail(500, { form, message: "Internal server error." });

    return { form };
  }
};
