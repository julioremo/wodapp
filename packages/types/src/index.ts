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

export type Block = {
  id?: string;
  title: string;
  description: string;
  duration: number | null;
  workout_type: string;
  sort_order: number;
};
