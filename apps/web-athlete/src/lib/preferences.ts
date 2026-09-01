import { fail, type RequestEvent } from "@sveltejs/kit";
import { type UserPreferences, userPreferencesSchema } from "@wodapp/core";
import { message, type SuperValidated, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import type { ZodObject, z } from "zod";

export function createPreferencesLoad<T extends ZodObject>(
  schema: T,
  category: keyof UserPreferences
) {
  return async ({ parent }: { parent: () => Promise<{ profile?: any }> }) => {
    const { profile } = await parent();
    const parsedPrefs = userPreferencesSchema.safeParse(profile?.preferences || {});
    const categoryData = parsedPrefs.success ? parsedPrefs.data[category] : {};
    const initialData = {
      preferences: { [category]: categoryData }
    };

    const form = await superValidate(initialData as any, zod4(schema));

    return { form };
  };
}

export async function mergeUserPreferences<K extends keyof UserPreferences>(
  supabase: any,
  userId: string,
  category: K,
  newCategoryData: UserPreferences[K]
) {
  // 1. Fetch current
  const { data } = await supabase.from("profiles").select("preferences").eq("id", userId).single();
  const parsedPrefs = userPreferencesSchema.safeParse(data?.preferences || {});
  // If corrupted, start fresh with an empty object
  const currentPrefs: Partial<UserPreferences> = parsedPrefs.success ? parsedPrefs.data : {};
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

export function createPreferencesAction<T extends ZodObject>(
  schema: T,
  category: keyof UserPreferences,
  successMessage = "Preferences saved!",
  onSuccess?: (event: RequestEvent, form: SuperValidated<z.infer<T>>) => void | Promise<void>
) {
  return async (event: RequestEvent) => {
    if (!event.locals.user) return fail(401, { message: "Unauthorized" });

    // Use event.request instead of request
    const form = await superValidate(event.request, zod4(schema));
    if (!form.valid) return fail(400, { form });

    const formData = form.data as unknown as { preferences: Record<string, any> };

    const { error } = await mergeUserPreferences(
      event.locals.supabase,
      event.locals.user.id,
      category,
      formData.preferences[category]
    );

    if (error) return message(form, "Failed to save preferences.", { status: 500 });
    if (onSuccess) {
      await onSuccess(event, form as unknown as SuperValidated<z.infer<T>>);
    }

    return message(form, successMessage);
  };
}
