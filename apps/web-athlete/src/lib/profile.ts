import { fail } from "@sveltejs/kit";
import { profileSchema, type UserProfile } from "@wodapp/core";
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
