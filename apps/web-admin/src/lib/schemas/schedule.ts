import { z } from "zod";

// Define a single time slot
export const sessionSchema = z.object({
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid"),
  duration: z.number().min(5).default(60),
  capacity: z.number().min(1, "Required").default(15),
  class_type: z.string().min(2, "Required").max(30, "Too long"),
  coach_id: z.string().optional(),
  program_id: z.string().nullable().optional()
});

export const editClassSchema = sessionSchema.extend({
  id: z.uuid(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date")
});

export const defaultSession = {
  time: "07:00",
  duration: 60,
  capacity: 15,
  class_type: "Crossfit"
};

export const scheduleFormSchema = z
  .object({
    start_date: z
      .string()
      .min(1, "Required")
      .refine(
        (dateStr) => {
          const date = new Date(dateStr);
          const today = new Date();
          const maxDate = new Date();
          maxDate.setFullYear(today.getFullYear() + 1); // 👈 The 1-Year Limit

          return date <= maxDate;
        },
        {
          message: "You cannot schedule classes more than 1 year in advance."
        }
      ),
    sessions: z.array(sessionSchema).min(1, "Add at least one class").default([defaultSession]),
    // Recurrence (Applies to the whole template)
    is_recurring: z.boolean().default(false),
    recurrence_end_date: z.string().optional(),
    weekdays: z.array(z.number()).default([])
  })
  .refine(
    (data) => {
      if (data.is_recurring && !data.recurrence_end_date) return false;
      if (data.is_recurring && data.weekdays.length === 0) return false;
      return true;
    },
    {
      message: "Recurrence settings incomplete",
      path: ["recurrence_end_date"]
    }
  );

export type Session = z.infer<typeof sessionSchema>;
export type ScheduleForm = z.infer<typeof scheduleFormSchema>;
export type EditClass = z.infer<typeof editClassSchema>;
