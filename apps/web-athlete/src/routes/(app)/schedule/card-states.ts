import type { BookingStatus } from "@wodapp/types";

// 1. Types & Domain
// =================

export type CardStateName =
  | "bookable"
  | "confirmed"
  | "past"
  | "past_booked"
  | "waitlist_available"
  | "waitlisted"
  | "outside_window";

export interface LessonCardData {
  isPast: boolean;
  userStatus?: BookingStatus | string | null;
  isOpen: boolean;
  isFull: boolean;
}

export type PendingAction = "book" | "cancel";
export type FormAction = "?/cancel" | "?/book";
export type ActionType = "cancel" | "book";

export interface ButtonLabelContext {
  waitlistPolicy?: "auto_enroll" | "broadcast";
  waitlistPosition?: number | null;
  waitlistTotal?: number;
  bookingOpensType?: "immediately" | "rolling_days" | "fixed_day";
  openTimeDate?: Date;
}

export interface LessonTimingContext {
  startTime: string | Date;
  openTime: string | Date;
  cancellationWindowHours?: number;
  now?: Date;
}

export interface LessonTiming {
  classTime: Date;
  openTimeDate: Date;
  cutoffTime: Date;
  isPast: boolean;
  isOpen: boolean;
  isLateWindow: boolean;
}

// 2. Timing & Capacity Helpers
// ============================

export function resolveLessonTiming(ctx: LessonTimingContext): LessonTiming {
  const classTime = new Date(ctx.startTime);
  const openTimeDate = new Date(ctx.openTime);
  const cancelWindowMs = (ctx.cancellationWindowHours || 0) * 60 * 60 * 1000;
  const cutoffTime = new Date(classTime.getTime() - cancelWindowMs);
  const nowMs = (ctx.now ?? new Date()).getTime();

  return {
    classTime,
    openTimeDate,
    cutoffTime,
    isPast: classTime.getTime() < nowMs,
    isOpen: nowMs >= openTimeDate.getTime(),
    isLateWindow: nowMs > cutoffTime.getTime()
  };
}

export function resolveSpotsLeft(
  capacity: number | null,
  confirmedBookingsCount: number
): number | null {
  return capacity !== null ? capacity - confirmedBookingsCount : null;
}

export function isLessonFull(capacity: number | null, confirmedBookingsCount: number): boolean {
  return capacity !== null && confirmedBookingsCount >= capacity;
}

export function isFewSpotsLeft(state: CardStateName, spotsLeft: number | null): boolean {
  return state === "bookable" && spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 3;
}

// 3. State & Action Resolvers
// ===========================

export function resolveCardState(data: LessonCardData): CardStateName {
  if (data.isPast && data.userStatus === "confirmed") return "past_booked";
  if (data.isPast) return "past";
  if (data.userStatus === "confirmed") return "confirmed";
  if (data.userStatus === "waitlist") return "waitlisted";
  if (!data.isOpen) return "outside_window";
  if (data.isFull) return "waitlist_available";
  return "bookable";
}

export function resolveFormAction(state: CardStateName): FormAction {
  return state === "confirmed" || state === "waitlisted" ? "?/cancel" : "?/book";
}

export function resolveActionType(state: CardStateName): ActionType {
  return state === "confirmed" || state === "waitlisted" ? "cancel" : "book";
}

export function isCardActionDisabled(state: CardStateName, isSubmitting: boolean): boolean {
  return isSubmitting || state === "past" || state === "past_booked" || state === "outside_window";
}

export function resolveButtonLabel(state: CardStateName, ctx: ButtonLabelContext = {}): string {
  switch (state) {
    case "bookable":
      return "Book";
    case "confirmed":
      return "Cancel";
    case "past":
      return "Finished";
    case "past_booked":
      return "Finished";
    case "waitlisted":
      return ctx.waitlistPolicy === "auto_enroll"
        ? `Waitlist (${ctx.waitlistPosition ?? ""})`
        : "Leave waitlist";
    case "waitlist_available":
      return ctx.waitlistPolicy === "broadcast" && (ctx.waitlistTotal ?? 0) > 0
        ? `Waitlist (${ctx.waitlistTotal} waiting)`
        : "Waitlist";
    case "outside_window":
      return ctx.bookingOpensType === "rolling_days" && ctx.openTimeDate
        ? `Opens ${ctx.openTimeDate.toLocaleTimeString([], {
            weekday: "short",
            hour: "numeric",
            minute: "2-digit"
          })}`
        : "Locked";
    default:
      return "Unavailable";
  }
}

export function resolveLateWindowConfirmation(
  state: CardStateName,
  isLateWindow: boolean
): { pendingAction: PendingAction; message: string } | null {
  if (!isLateWindow) return null;
  if (state === "confirmed") {
    return {
      pendingAction: "cancel",
      message: "This is a late cancellation. You may incur a penalty. Proceed?"
    };
  }
  if (state === "bookable") {
    return {
      pendingAction: "book",
      message:
        "You are booking past the free cancellation window. If you cancel later, you may incur a penalty. Proceed?"
    };
  }
  return null;
}
