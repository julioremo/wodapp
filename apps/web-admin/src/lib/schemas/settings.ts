import type { GymSettings } from "@wodapp/types";
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

export const classTypesFormSchema = z.object({
  classTypes: z.array(classTypeSchema)
});

export const schedulePreferencesSchema = z.object({
  schedulePrefs: z
    .object({
      hiddenDays: z.array(z.number()),
      startHour: z.number().int().min(0).max(23).default(6),
      endHour: z.number().int().min(1).max(24).default(22)
    })
    .refine((data) => data.endHour > data.startHour, {
      message: "End hour must be later than start hour",
      path: ["endHour"]
    })
});

export const penaltySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("credit_deduction"),
    strikes: z.coerce.number().int().min(1).default(1),
    needs_confirmation: z.boolean().default(false)
  }),
  z.object({
    type: z.literal("booking_delay"),
    strikes: z.coerce.number().int().min(1).default(1),
    delay_minutes: z.coerce.number().int().min(1).default(60),
    needs_confirmation: z.boolean().default(false)
  }),
  z.object({
    type: z.literal("fee"),
    strikes: z.coerce.number().int().min(1).default(1),
    amount: z.coerce.number().min(0.1).default(5.0),
    needs_confirmation: z.boolean().default(true)
  })
]);

export const bookingPoliciesSchema = z.object({
  policies: z.object({
    booking_opens: z.object({
      type: z.enum(["immediately", "fixed_day", "rolling_days"]),
      dayOfWeek: z.coerce.number().int().nullable(),
      hour: z.coerce.number().nullable(),
      days: z.coerce.number().nullable()
    }),
    booking_closes: z.object({
      active: z.boolean(),
      minutes_prior: z.coerce.number().nullable()
    }),
    cancellation: z.object({
      active: z.boolean(),
      window_hours: z.coerce.number().nullable(),
      penalty: penaltySchema
    }),
    no_show: z.object({
      active: z.boolean(),
      penalty: penaltySchema
    }),
    waitlist: z.object({
      active: z.boolean(),
      max_size: z.coerce.number().nullable(),
      mode: z.enum(["broadcast", "auto_enroll"]),
      auto_enroll_cutoff_hours: z.coerce.number().nullable()
    })
  })
});

export const gymSettingsSchema = z.object({
  ...schedulePreferencesSchema.shape,
  ...classTypesFormSchema.shape,
  ...bookingPoliciesSchema.shape
}) satisfies z.ZodType<GymSettings>;

export type BookingPolicies = z.infer<typeof bookingPoliciesSchema>;
export type Penalty = z.infer<typeof penaltySchema>;

export type GymSettingsSchema = z.infer<typeof gymSettingsSchema>;

// export const PRESETS = {
//   none: {
//     policies: {
//       cancellation: {
//         enabled: false,
//         window_hours: 4,
//         strikes: { weightPerCancel: 1 },
//         penalties: {
//           credit: { enabled: false, activateAfterStrikes: 1, deductAmount: 1 },
//           bookingWindowDelay: {
//             enabled: false,
//             activateAfterStrikes: 3,
//             delayMinutesPerCancel: 60
//           },
//           fee: { enabled: false, activateAfterStrikes: 3, amountEuros: 5 }
//         }
//       }
//     }
//   },
//   lenient: {
//     policies: {
//       cancellation: {
//         enabled: true,
//         window_hours: 12,
//         strikes: { weightPerCancel: 1 },
//         penalties: {
//           credit: { enabled: false, activateAfterStrikes: 3, deductAmount: 1 },
//           bookingWindowDelay: {
//             enabled: false,
//             activateAfterStrikes: 5,
//             delayMinutesPerCancel: 30
//           },
//           fee: { enabled: false, activateAfterStrikes: 5, amountEuros: 2 }
//         }
//       }
//     }
//   },
//   standard: {
//     policies: {
//       cancellation: {
//         enabled: true,
//         window_hours: 4,
//         strikes: { weightPerCancel: 1 },
//         penalties: {
//           credit: { enabled: true, activateAfterStrikes: 1, deductAmount: 1 },
//           bookingWindowDelay: {
//             enabled: false,
//             activateAfterStrikes: 3,
//             delayMinutesPerCancel: 60
//           },
//           fee: { enabled: false, activateAfterStrikes: 3, amountEuros: 5 }
//         }
//       }
//     }
//   },
//   strict: {
//     policies: {
//       cancellation: {
//         enabled: true,
//         window_hours: 2,
//         strikes: { weightPerCancel: 1 },
//         penalties: {
//           credit: { enabled: true, activateAfterStrikes: 1, deductAmount: 1 },
//           bookingWindowDelay: { enabled: true, activateAfterStrikes: 3, delayMinutesPerCancel: 60 },
//           fee: { enabled: true, activateAfterStrikes: 3, amountEuros: 10 }
//         }
//       }
//     }
//   }
// } satisfies Record<string, Omit<BookingPolicies, "meta">>;
