import { z } from "zod";

export const logScoreSchema = z.object({
  movement_id: z.string().uuid("Please select a movement"),
  date: z.coerce.date().default(() => new Date()),
  score: z.coerce.number().positive("Score must be greater than 0"),
  reps: z.coerce.number().int().min(1).default(1),
  notes: z.string().trim().optional()
});
