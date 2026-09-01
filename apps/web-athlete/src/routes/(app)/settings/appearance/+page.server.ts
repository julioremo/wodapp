import { appearancePreferencesSchema } from "@wodapp/core";
import { createPreferencesAction, createPreferencesLoad } from "$lib/preferences";

export const load = createPreferencesLoad(appearancePreferencesSchema, "appearance");

export const actions = {
  default: createPreferencesAction(
    appearancePreferencesSchema,
    "appearance",
    "Appearance has been updated!",
    (event, form) => {
      const theme = form.data.preferences.appearance.theme;
      event.cookies.set("theme", theme, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: false // allows client JS to read it if needed
      });
    }
  )
};
