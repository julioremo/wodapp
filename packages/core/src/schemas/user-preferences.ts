import { z } from "zod";

export const appearanceSchema = z
  .object({
    theme: z.enum(["light", "dark", "system"]).default("system")
  })
  .default({ theme: "system" });

export const notificationsSchema = z
  .object({
    workout_reminders: z.boolean().default(true),
    marketing_emails: z.boolean().default(false)
  })
  .default({ workout_reminders: true, marketing_emails: false });

export const privacySchema = z
  .object({
    show_on_roster: z.boolean().default(true),
    show_on_leaderboard: z.boolean().default(true),
    share_biometrics: z.boolean().default(false)
  })
  .default({ show_on_roster: true, show_on_leaderboard: true, share_biometrics: false });

export const userPreferencesSchema = z.object({
  appearance: appearanceSchema,
  notifications: notificationsSchema,
  privacy: privacySchema
});

export const privacyPreferencesSchema = z.object({
  preferences: z.object({ privacy: privacySchema }).default({})
});

export const notificationsPreferencesSchema = z.object({
  preferences: z.object({ notifications: notificationsSchema }).default({})
});

export const appearancePreferencesSchema = z.object({
  preferences: z.object({ appearance: appearanceSchema }).default({})
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
