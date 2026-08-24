import { appearancePreferencesSchema } from "@wodapp/core";
import { createPreferencesAction, createPreferencesLoad } from "$lib/preferences";

export const load = createPreferencesLoad(appearancePreferencesSchema, "appearance");

export const actions = {
  default: createPreferencesAction(
    appearancePreferencesSchema,
    "appearance",
    "Appearance has been updated!"
  )
};
