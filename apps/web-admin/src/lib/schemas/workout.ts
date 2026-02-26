import { z } from "zod";

export const workoutSchema = z.object({
  title: z.string().optional(), // e.g. "Murph"
  description: z.string().min(1, "Description is required"),
  date: z.string().optional(),
  class_type: z.string().default(""),
  apply_to_all: z.boolean().default(true),
  selected_class_ids: z.array(z.string()).default([])
});

export type WorkoutSchema = z.infer<typeof workoutSchema>;
