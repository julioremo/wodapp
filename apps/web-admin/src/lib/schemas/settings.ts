import { z } from "zod";

export const classTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string(),
  isProgrammable: z.boolean(),
  isActive: z.boolean(),
  defaultCoachId: z.string().nullable(),
  defaultDuration: z.number().int().min(1, "Must be at least 1 min").max(1440),
  defaultCapacity: z.number().int().min(1, "Must be at least 1").max(1000)
});

export const gymSettingsBaseSchema = z.object({
  defaultClassColor: z.string(),
  hiddenDays: z.array(z.number()),
  startHour: z.number().int().min(0).max(23).default(6),
  endHour: z.number().int().min(1).max(24).default(22),
  classTypes: z.array(classTypeSchema)
});

// Export the refined schema for the server
export const gymSettingsSchema = gymSettingsBaseSchema.refine(
  (data) => data.endHour > data.startHour,
  {
    message: "End hour must be later than start hour",
    path: ["endHour"]
  }
);

export type GymSettingsSchema = z.infer<typeof gymSettingsBaseSchema>;
