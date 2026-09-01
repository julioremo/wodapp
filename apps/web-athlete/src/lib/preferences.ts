import { fail, type RequestEvent } from "@sveltejs/kit";
import { type UserPreferences, userPreferencesSchema } from "@wodapp/core";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import type { ZodObject } from "zod";

export function createPreferencesLoad(schema: ZodObject, category: keyof UserPreferences) {
  return async ({ parent }: any) => {
    const { profile } = await parent();
    const safePrefs = userPreferencesSchema.parse(profile?.preferences || {});

    const form = await superValidate(
      { preferences: { [category]: safePrefs[category] } },
      zod4(schema)
    );

    return { form };
  };
}

export async function mergeUserPreferences(
  supabase: any,
  userId: string,
  category: "privacy" | "notifications" | "appearance",
  newCategoryData: any
) {
  // 1. Fetch current
  const { data } = await supabase.from("profiles").select("preferences").eq("id", userId).single();
  const currentPrefs = userPreferencesSchema.parse(data?.preferences || {});
  // 2. Merge this category with existing
  const updatedPreferences = {
    ...currentPrefs,
    [category]: {
      ...currentPrefs[category],
      ...newCategoryData
    }
  };
  // 3. Save and return
  return await supabase
    .from("profiles")
    .update({ preferences: updatedPreferences })
    .eq("id", userId);
}

export function createPreferencesAction(
  schema: ZodObject,
  category: keyof UserPreferences,
  successMessage = "Preferences saved!"
) {
  return async ({ request, locals: { supabase, user } }: RequestEvent) => {
    if (!user) return fail(401, { message: "Unauthorized" });

    const form = await superValidate(request, zod4(schema));
    if (!form.valid) return fail(400, { form });

    const { error } = await mergeUserPreferences(
      supabase,
      user.id,
      category,
      form.data.preferences[category]
    );

    if (error) return message(form, "Failed to save preferences.", { status: 500 });
    return message(form, successMessage);
  };
}
