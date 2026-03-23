import {
    addSeconds,
    format,
    isToday,
    isTomorrow,
    set,
    setDay,
    startOfWeek,
    subDays,
    subWeeks,
} from "date-fns";

type BookingOpensPolicy = {
    type: "rolling_days" | "fixed_day" | "immediately";
    days?: number | null;
    dayOfWeek?: number | null;
    hour?: number | null;
};

export function calculateOpenTime(
    classStartTime: Date | string,
    policy: BookingOpensPolicy,
    bookingDelayMinutes: number = 0,
): Date {
    const classTime = new Date(classStartTime);
    let openTime = classTime;

    if (policy.type === "rolling_days" && policy.days != null) {
        openTime = subDays(classTime, policy.days);
        if (policy.hour != null) {
            openTime = set(openTime, {
                hours: policy.hour,
                minutes: 0,
                seconds: 0,
                milliseconds: 0,
            });
        }
    } else if (
        policy.type === "fixed_day" && policy.dayOfWeek != null &&
        policy.hour != null
    ) {
        const classWeekStart = startOfWeek(classTime, { weekStartsOn: 1 });
        const previousWeek = subWeeks(classWeekStart, 1);
        const targetDate = setDay(previousWeek, policy.dayOfWeek, {
            weekStartsOn: 1,
        });
        openTime = set(targetDate, {
            hours: policy.hour,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
        });
    } else if (policy.type === "immediately") {
        openTime = new Date(0);
    }

    if (bookingDelayMinutes > 0) {
        openTime = addSeconds(openTime, Math.round(bookingDelayMinutes * 60));
    }

    return openTime;
}

export type AvailabilityState =
    | { type: "now" }
    | { type: "countdown"; minutes: number; seconds: number }
    | { type: "today"; timeStr: string }
    | { type: "tomorrow"; timeStr: string }
    | { type: "future"; dayStr: string; timeStr: string };

export function getAvailability(
    openTime: Date | string,
    now: Date,
): AvailabilityState {
    const target = new Date(openTime);
    const diffMs = target.getTime() - now.getTime();

    if (diffMs <= 0) {
        return { type: "now" };
    }

    if (diffMs <= 60 * 60 * 1000) {
        return {
            type: "countdown",
            minutes: Math.floor(diffMs / 60000),
            seconds: Math.floor((diffMs % 60000) / 1000),
        };
    }

    const timeStr = format(target, "h:mm a");

    if (isToday(target)) {
        return { type: "today", timeStr };
    }

    if (isTomorrow(target)) {
        return { type: "tomorrow", timeStr };
    }

    return {
        type: "future",
        dayStr: format(target, "EEEE"),
        timeStr,
    };
}
