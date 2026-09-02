import { z } from "zod";
import { type GymSettings, gymSettingsSchema } from "./admin-settings";

export const locationSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  logo_url: z.string().url().nullable().optional(),
  settings: gymSettingsSchema.nullable().optional(),
  theme: z.object(z.any()).nullable().optional()
});

export interface Location {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  settings: GymSettings | null;
  theme: Record<string, any> | null;
}
