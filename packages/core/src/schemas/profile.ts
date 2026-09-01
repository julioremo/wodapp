import { z } from "zod";
import { userPreferencesSchema } from "./user-preferences";

export const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required").default(""),
  last_name: z.string().min(1, "Last name is required").default(""),
  display_name: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  // Fun
  avatar_url: z.string().nullable().default(null),
  emoji: z.string().max(2).nullable().default(null),
  // Biometrics
  birthdate: z.string().nullable().default(null), // standard yyyy-mm-dd
  gender: z.string().nullable().default(null),
  height: z.number().positive().nullable().default(null),
  weight: z.number().positive().nullable().default(null),
  // Emergency
  emergency_contact_name: z.string().nullable().default(null),
  emergency_contact_phone: z.string().nullable().default(null),
  // Preferences
  preferences: userPreferencesSchema.default({})
});

export const displayNameSchema = profileSchema.pick({
  display_name: true
});

export const avatarSchema = profileSchema.pick({
  avatar_url: true
});

export const personalInfoSchema = profileSchema.pick({
  first_name: true,
  last_name: true,
  phone: true
  // emoji: true
});

export const biometricsSchema = profileSchema.pick({
  birthdate: true,
  gender: true,
  height: true,
  weight: true
});

export const emergencyContactSchema = profileSchema.pick({
  emergency_contact_name: true,
  emergency_contact_phone: true
});

export type UserProfile = z.infer<typeof profileSchema>;
export type DisplayName = z.infer<typeof displayNameSchema>;
export type Avatar = z.infer<typeof avatarSchema>;
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type Biometrics = z.infer<typeof biometricsSchema>;
export type EmergencyContact = z.infer<typeof emergencyContactSchema>;
