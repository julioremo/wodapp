import { error, fail } from "@sveltejs/kit";
import type { GymSettings } from "@wodapp/types"; // Adjust path as needed
import {
  addMinutes,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  parseISO,
  set,
  setDay,
  setHours,
  startOfWeek,
  subDays,
  subHours,
  subMinutes,
  subWeeks
} from "date-fns";

export const load = async ({ url, parent, locals: { supabase } }) => {
  const { activeLocation } = await parent();

  if (!activeLocation) {
    return { classes: [], filterOptions: { allClassTypes: [], bounds: { min: 0, max: 0 } } };
  }

  const settings = (activeLocation.settings || {}) as GymSettings;

  const dateParam = url.searchParams.get("date");
  const targetDate = dateParam ? parseISO(dateParam) : new Date();
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });

  const filterType = url.searchParams.get("type");

  // 1. Clean Query Builder
  let query = supabase
    .from("classes")
    .select(`
      *,
      coach:profiles (id, display_name, avatar_url),
      bookings (
        id,
        profile_id,
        status,
        profile:profiles (avatar_url)
      )
    `)
    .eq("location_id", activeLocation.id)
    .gte("start_time", weekStart.toISOString())
    .lte("start_time", weekEnd.toISOString())
    .order("start_time", { ascending: true });

  // Apply Filter Server-Side securely
  if (filterType) {
    query = query.eq("type", filterType);
  }

  const { data: classes, error: dbError } = await query;

  if (dbError) {
    console.error("Error fetching classes:", dbError);
    throw error(500, "Could not fetch schedule.");
  }

  // 2. Derive Metadata from JSONB Settings (Zero extra DB calls)

  // A. Get active class types directly from settings
  const allClassTypes =
    settings.classTypes
      ?.filter((ct) => ct.isActive)
      .map((ct) => ct.name)
      .sort() || [];

  // B. Get bounds directly from schedule preferences
  const bounds = {
    min: (settings.schedulePrefs?.startHour || 6) * 60,
    max: (settings.schedulePrefs?.endHour || 22) * 60
  };

  return {
    classes,
    weekStart,
    // Pass policies to the client so the UI can disable buttons appropriately
    policies: settings.policies,
    filterOptions: {
      allClassTypes,
      bounds
    }
  };
};

async function getBookingContext(supabase: any, classId: string) {
  const { data: targetClass, error: classError } = await supabase
    .from("classes")
    .select("start_time, location_id, capacity")
    .eq("id", classId)
    .single();

  if (classError || !targetClass) throw new Error("Class not found.");

  const { data: location, error: locError } = await supabase
    .from("locations")
    .select("settings")
    .eq("id", targetClass.location_id)
    .single();

  if (locError || !location) throw new Error("Location not found.");

  return {
    targetClass,
    settings: (location.settings || {}) as GymSettings
  };
}

export const actions = {
  book: async ({ request, locals }) => {
    const formData = await request.formData();
    const classId = formData.get("classId") as string;

    if (!locals.user) return fail(401, { error: "Unauthorized" });

    try {
      const { targetClass, settings } = await getBookingContext(locals.supabase, classId);
      const policies = settings.policies;
      const now = new Date();
      const startTime = parseISO(targetClass.start_time);

      const { data: membership } = await locals.supabase
        .from("memberships")
        .select("booking_lockout_until")
        .match({ profile_id: locals.user.id, location_id: targetClass.location_id })
        .single();

      if (membership?.booking_lockout_until) {
        const lockoutDate = new Date(membership.booking_lockout_until);
        if (isAfter(lockoutDate, now)) {
          return fail(403, {
            error: `Your booking privileges are suspended until ${format(lockoutDate, "h:mm a")}.`
          });
        }
      }

      if (policies?.booking_closes?.active && policies.booking_closes.minutes_prior != null) {
        const closeTime = subMinutes(startTime, policies.booking_closes.minutes_prior);
        if (isAfter(now, closeTime)) {
          return fail(400, { error: "Booking is closed for this class." });
        }
      }

      if (policies?.booking_opens) {
        let openTime: Date | null = null;

        if (policies.booking_opens.type === "rolling_days" && policies.booking_opens.days != null) {
          openTime = subDays(startTime, policies.booking_opens.days);
        } else if (
          policies.booking_opens.type === "fixed_day"
          && policies.booking_opens.dayOfWeek != null
          && policies.booking_opens.hour != null
        ) {
          const classWeekStart = startOfWeek(startTime, { weekStartsOn: 1 });
          const previousWeek = subWeeks(classWeekStart, 1);
          const targetDate = setDay(previousWeek, policies.booking_opens.dayOfWeek, {
            weekStartsOn: 1
          });
          openTime = set(targetDate, {
            hours: policies.booking_opens.hour,
            minutes: 0,
            seconds: 0,
            milliseconds: 0
          });
        }

        if (openTime && isBefore(now, openTime)) {
          return fail(400, { error: "Booking window is not yet open." });
        }
      }

      const { error } = await locals.supabase.from("bookings").insert({
        class_id: classId,
        profile_id: locals.user.id,
        status: "confirmed"
      });

      if (error && error.code !== "23505") return fail(500, { error: "Could not book class." });

      return { success: true };
    } catch (err: any) {
      return fail(400, { error: err.message });
    }
  },

  cancel: async ({ request, locals }) => {
    const formData = await request.formData();
    const classId = formData.get("classId") as string;

    if (!locals.user) return fail(401, { error: "Unauthorized" });

    try {
      const { targetClass, settings } = await getBookingContext(locals.supabase, classId);
      const policies = settings.policies;
      const now = new Date();
      const startTime = parseISO(targetClass.start_time);

      // 1. Evaluate Late Cancellation Penalty
      if (policies?.cancellation?.active && policies.cancellation.window_hours != null) {
        const penaltyCutoff = subHours(startTime, policies.cancellation.window_hours);

        if (isAfter(now, penaltyCutoff)) {
          const penalty = policies.cancellation.penalty;
          const initialStatus = penalty.needs_confirmation ? "pending_review" : "counted";

          // Record the infraction
          const { error: infractionError } = await locals.supabase.from("infractions").insert({
            profile_id: locals.user.id,
            location_id: targetClass.location_id,
            class_id: classId,
            reason: "late_cancel",
            status: initialStatus
          });

          if (infractionError) {
            console.error("Infraction recording failed:", infractionError);
            return fail(500, { error: "Failed to process cancellation penalty." });
          }

          // Evaluate automatic strikes
          if (initialStatus === "counted") {
            const { data: activeInfractions } = await locals.supabase
              .from("infractions")
              .select("id")
              .match({
                profile_id: locals.user.id,
                location_id: targetClass.location_id,
                reason: "late_cancel",
                status: "counted"
              });

            if (activeInfractions && activeInfractions.length >= penalty.strikes) {
              const infractionIds = activeInfractions.map((i) => i.id);

              await enforcePenalty(
                locals.supabase,
                locals.user.id,
                targetClass.location_id,
                penalty,
                infractionIds
              );
            }
          }
        }
      }

      // 2. Execute the actual cancellation
      const { error } = await locals.supabase.from("bookings").delete().match({
        class_id: classId,
        profile_id: locals.user.id
      });

      if (error) return fail(500, { error: "Could not cancel booking." });

      return { success: true };
    } catch (err: any) {
      return fail(400, { error: err.message });
    }
  }
};
