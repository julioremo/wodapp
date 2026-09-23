import type { Booking, BookingStatus, Database, Lesson, Membership, Profile } from "@wodapp/types";

export type { Booking, BookingStatus, Database, Lesson, Membership, Profile };

export type CoachProfile = Pick<Profile, "display_name" | "avatar_url">;

export type BookingWithProfile = Pick<Booking, "id" | "status" | "profile_id" | "created_at"> & {
  profile: Pick<Profile, "avatar_url" | "display_name"> | null;
};

export interface LessonParticipant {
  id: string;
  avatarUrl: string | null;
  name?: string | null;
}

export type ScheduledLesson = Pick<
  Lesson,
  "id" | "class_type" | "start_time" | "capacity" | "confirmed_bookings_count"
> & {
  duration?: number;
  coach: CoachProfile | null;
  showCoach?: boolean;
  bookings: BookingWithProfile[];
  attendees: LessonParticipant[];
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
  allLessonTypes: string[];
  bounds: { min: number; max: number };
  showCoachFilter: boolean;
  allCoaches: string[];
}

export interface ActiveScheduleFilters {
  selectedTypes: string[];
  selectedCoaches: string[];
  timeRange: [number, number];
}
export type LessonHue = "red" | "blue" | "purple" | "camel" | "yellow" | "green" | "paper";

export interface LessonCardProps {
  id: string;
  lessonType: string;
  startTime: string;
  duration?: number | null;
  capacity: number | null;
  confirmedBookingsCount: number;
  coachDisplayName?: string | null;
  coachAvatarUrl?: string | null;
  showCoach?: boolean;
  attendees?: LessonParticipant[];
  userStatus: BookingStatus | null;
  openTime: string | Date;
  waitlistTotal: number;
  waitlistPosition: number | null;
  bookingOpensType: "rolling_days" | "fixed_day" | "immediately";
  cancellationWindowHours: number;
  waitlistPolicy: "broadcast" | "auto_enroll";
  lessonHue?: LessonHue;
}

export interface BookLessonResult {
  success: boolean;
  status: BookingStatus;
}

export interface CancelLessonResult {
  success: boolean;
  message?: string;
}
