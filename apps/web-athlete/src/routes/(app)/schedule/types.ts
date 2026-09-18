import type { Booking, BookingStatus, ClassSession, Database, Membership, Profile } from "@wodapp/types";

export type { Booking, BookingStatus, ClassSession, Database, Membership, Profile };

export type CoachProfile = Pick<Profile, "display_name" | "avatar_url">;

export type BookingWithProfile = Pick<Booking, "id" | "status" | "profile_id" | "created_at"> & {
  profile: Pick<Profile, "avatar_url" | "display_name"> | null;
};

export interface ClassAttendee {
  id: string;
  avatarUrl: string | null;
  name?: string | null;
}

export type ScheduledClass = Pick<
  ClassSession,
  "id" | "class_type" | "start_time" | "capacity" | "confirmed_bookings_count"
> & {
  duration?: number;
  coach: CoachProfile | null;
  bookings: BookingWithProfile[];
  attendees: ClassAttendee[];
  openTime: Date | string;
  userStatus: BookingStatus | null;
  waitlistTotal: number;
  waitlistPosition: number | null;
  bookingOpensType: "rolling_days" | "fixed_day" | "immediately";
  cancellationWindowHours: number;
  waitlistPolicy: "broadcast" | "auto_enroll";
  color?: string | null;
};

export interface ScheduleFilterOptions {
  allClassTypes: string[];
  bounds: { min: number; max: number };
  showCoachFilter: boolean;
  allCoaches: string[];
}

export interface ActiveScheduleFilters {
  selectedTypes: string[];
  selectedCoaches: string[];
  timeRange: [number, number];
}

export interface ClassCardProps {
  id: string;
  classType: string;
  startTime: string;
  duration?: number | null;
  capacity: number | null;
  confirmedBookingsCount: number;
  coachDisplayName?: string | null;
  coachAvatarUrl?: string | null;
  attendees?: ClassAttendee[];
  userStatus: BookingStatus | null;
  openTime: string | Date;
  waitlistTotal: number;
  waitlistPosition: number | null;
  bookingOpensType: "rolling_days" | "fixed_day" | "immediately";
  cancellationWindowHours: number;
  waitlistPolicy: "broadcast" | "auto_enroll";
  color?: string | null;
}

export interface BookClassResult {
  success: boolean;
  status: BookingStatus;
}

export interface CancelClassResult {
  success: boolean;
  message?: string;
}
