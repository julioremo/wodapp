import { z } from "zod";

export const workoutSchema = z.object({
  id: z.uuid().nullable().optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().min(1, "Description cannot be empty"),
  duration: z.number().int().min(1, "Must be > 0").max(300, "Too long"),
  workout_type: z.string().min(1, "Block type required"),
  class_type: z.string().nullable().optional()
});

export type WorkoutSchema = z.infer<typeof workoutSchema>;
