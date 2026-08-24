import { notificationsPreferencesSchema } from "@wodapp/core";
import { createPreferencesAction, createPreferencesLoad } from "$lib/preferences";

export const load = createPreferencesLoad(notificationsPreferencesSchema, "privacy");

export const actions = {
  default: createPreferencesAction(
    notificationsPreferencesSchema,
    "privacy",
    "Privacy preferences updated!"
  )
};
