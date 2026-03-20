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
      endHour: z.number().int().min(1).max(24).default(22),
      show_schedule_outside_window: z.boolean().default(true)
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
      penalty: penaltySchema.nullable()
    }),
    no_show: z.object({
      active: z.boolean(),
      penalty: penaltySchema.nullable()
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
});

export type BookingPolicies = z.infer<typeof bookingPoliciesSchema>;
export type Penalty = z.infer<typeof penaltySchema>;
export type GymSettings = z.infer<typeof gymSettingsSchema>;

type Policies = GymSettings["policies"];

export const policyPresets = {
  none: {
    cancellation: {
      active: false,
      window_hours: null,
      penalty: null
    },
    no_show: {
      active: false,
      penalty: null
    }
  },
  lenient: {
    cancellation: {
      active: true,
      window_hours: 2,
      penalty: { type: "booking_delay", delay_minutes: 0.5, strikes: 1, needs_confirmation: false }
    },
    no_show: {
      active: true,
      penalty: { type: "booking_delay", delay_minutes: 1, strikes: 1, needs_confirmation: false }
    }
  },
  strict: {
    cancellation: {
      active: true,
      window_hours: 24,
      penalty: { type: "credit_deduction", strikes: 1, needs_confirmation: false }
    },
    no_show: {
      active: true,
      penalty: { type: "fee", amount: 5, strikes: 3, needs_confirmation: true }
    }
  }
} satisfies Record<string, Partial<Policies>>;

export const defaultSettings: GymSettings = {
  schedulePrefs: {
    hiddenDays: [0],
    startHour: 6,
    endHour: 22,
    show_schedule_outside_window: true
  },
  classTypes: [
    {
      name: "CrossFit",
      color: "#4E79A7",
      isProgrammable: true,
      isActive: true,
      defaultCoachId: null,
      defaultDuration: 60,
      defaultCapacity: 15
    },
    {
      name: "Weightlifting",
      color: "#F28E2B",
      isProgrammable: false,
      isActive: true,
      defaultCoachId: null,
      defaultDuration: 60,
      defaultCapacity: 15
    },
    {
      name: "Gymnastics",
      color: "#59A14F",
      isProgrammable: true,
      isActive: true,
      defaultCoachId: null,
      defaultDuration: 60,
      defaultCapacity: 15
    },
    {
      name: "Open Box",
      color: "#79706E",
      isProgrammable: false,
      isActive: true,
      defaultCoachId: null,
      defaultDuration: 60,
      defaultCapacity: 15
    }
  ],
  policies: {
    booking_opens: { type: "fixed_day", days: null, dayOfWeek: 4, hour: 12 },
    booking_closes: { active: false, minutes_prior: null },
    waitlist: { active: true, max_size: null, mode: "broadcast", auto_enroll_cutoff_hours: null },
    ...policyPresets.none
  }
} satisfies GymSettings;
