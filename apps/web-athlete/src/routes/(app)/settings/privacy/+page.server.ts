import { privacyPreferencesSchema } from "@wodapp/core";
import { createPreferencesAction, createPreferencesLoad } from "$lib/preferences";

export const load = createPreferencesLoad(privacyPreferencesSchema, "privacy");

export const actions = {
  default: createPreferencesAction(
    privacyPreferencesSchema,
    "privacy",
    "Privacy preferences updated!"
  )
};
