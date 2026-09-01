import type { UserPreferences } from "@wodapp/core";
import { userPreferencesSchema } from "@wodapp/core";

export const load = async ({ cookies, locals: { safeGetSession, supabase } }) => {
  const { session, user } = await safeGetSession();

  let theme = (cookies.get("theme") || "system") as UserPreferences["appearance"]["theme"];

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .single();

    const parsedPrefs = userPreferencesSchema.safeParse(data?.preferences || {});

    if (parsedPrefs.success) {
      const dbTheme = parsedPrefs.data.appearance?.theme;
      if (dbTheme && dbTheme !== theme) {
        theme = dbTheme;
      }
    } else {
      console.warn("User preferences failed validation:", parsedPrefs.error);
    }
  }

  return { session, user, theme };
};
