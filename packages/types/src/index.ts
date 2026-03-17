import type { Database } from "./database.types";

export type { Database };
// Mapping the DB rows to clean names
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Location = Database["public"]["Tables"]["locations"]["Row"];
export type Membership = Database["public"]["Tables"]["memberships"]["Row"];
export type Workout = Database["public"]["Tables"]["workouts"]["Row"];
export type ClassSession = Database["public"]["Tables"]["classes"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Result = Database["public"]["Tables"]["results"]["Row"];
export type Program = Database["public"]["Tables"]["programs"]["Row"];
export type UserRole = Database["public"]["Enums"]["user_role"];
export type BookingStatus = Database["public"]["Enums"]["booking_status"];

export type PenaltyConfig =
  | {
      type: "credit_deduction";
      strikes: number;
    }
  | {
      type: "booking_delay";
      strikes: number;
      delay_minutes: number;
    }
  | {
      type: "fee";
      strikes: number;
      amount: number;
    };

export interface GymSettings {
  schedulePrefs: {
    hiddenDays: number[];
    startHour: number;
    endHour: number;
  };
  classTypes: {
    name: string;
    color: string;
    isProgrammable: boolean;
    isActive: boolean;
    defaultCoachId: string | null;
    defaultDuration: number;
    defaultCapacity: number;
  }[];
  policies: {
    booking_opens: {
      type: "immediately" | "fixed_day" | "rolling_days";
      dayOfWeek: number | null; // 0-6 for Sun-Sat
      hour: number | null; // 0-23
      days: number | null;
    };
    booking_closes: {
      active: boolean;
      minutes_prior: number | null;
    };
    cancellation: {
      active: boolean;
      window_hours: number | null;
      penalty: PenaltyConfig;
    };
    no_show: {
      active: boolean;
      penalty: PenaltyConfig;
    };
    waitlist: {
      active: boolean;
      max_size: number | null;
      mode: "broadcast" | "auto_enroll";
      auto_enroll_cutoff_hours: number | null;
    };
  };
}

export type Block = {
  id?: string;
  title: string;
  description: string;
  duration: number | null;
  workout_type: string;
  sort_order: number;
};
