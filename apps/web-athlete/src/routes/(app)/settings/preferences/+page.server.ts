// src/routes/settings/preferences/+page.server.ts
import { fail } from "@sveltejs/kit";
import { userPreferencesSchema } from "@wodapp/core";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 as zod } from "sveltekit-superforms/adapters";

export const load = async ({ parent }) => {
  const { profile } = await parent();

  // Initialize Superforms with existing DB data, falling back to schema defaults
  const form = await superValidate(profile?.preferences || {}, zod(userPreferencesSchema));

  return { form };
};

export const actions = {
  default: async ({ request, locals: { supabase, user } }) => {
    if (!user) return fail(401, { message: "Unauthorized" });

    // 1. Validate the form natively with Superforms
    const form = await superValidate(request, zod(userPreferencesSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    // 2. Fetch current DB state to prevent overwriting keys not in this form
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .single();

    const existingPreferences = currentProfile?.preferences || {};

    // 3. Deep merge the existing preferences with the new validated form data
    const updatedPreferences = {
      ...existingPreferences,
      ...form.data,
      notifications: {
        ...(existingPreferences.notifications || {}),
        ...form.data.notifications
      },
      calendar: {
        ...(existingPreferences.calendar || {}),
        ...form.data.calendar
      }
    };

    // 4. Save to Supabase
    const { error } = await supabase
      .from("profiles")
      .update({ preferences: updatedPreferences })
      .eq("id", user.id);

    if (error) {
      return message(form, "Failed to update preferences.", { status: 500 });
    }

    return message(form, "Preferences updated successfully!");
  }
};
