import type { SupabaseClient } from "@supabase/supabase-js";
import { error, fail, redirect } from "@sveltejs/kit";
import { calculateOpenTime, defaultSettings, type GymSettings } from "@wodapp/core";
import { isBefore, startOfDay, startOfWeek } from "date-fns";
import type { Actions, PageServerLoad } from "./$types";
import type {
  BookClassResult,
  BookingStatus,
  BookingWithProfile,
  CancelClassResult,
  ClassAttendee,
  Database,
  ScheduledClass,
  ScheduleFilterOptions
} from "./types";

export const load: PageServerLoad = async ({ locals, url, parent }) => {
  const { user, activeLocation, memberships } = await parent();

  if (!user) {
    throw redirect(303, "/login");
  }

  if (!activeLocation) {
    return {
      activeLocation: null,
      schedule: [] as ScheduledClass[],
      filterOptions: {
        allClassTypes: [] as string[],
        bounds: { min: 360, max: 1320 },
        showCoachFilter: false,
        allCoaches: [] as string[]
      } as ScheduleFilterOptions
    };
  }

  const userId = user.id;
  const locationId = activeLocation.id;
  const membership = memberships?.find((m) => m.location_id === locationId);

  if (!membership) {
    throw error(403, "No active membership found for this location.");
  }

  // Parse target date from URL or fallback to today
  const dateParam = url.searchParams.get("date");
  const targetDate = dateParam ? new Date(dateParam) : new Date();
  const currentWeekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
  // Query starting from the beginning of the currently viewed week or this week, whichever is earlier
  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const queryStartDate = isBefore(currentWeekStart, thisWeekStart)
    ? currentWeekStart
    : thisWeekStart;

  // 1. Fetch settings and classes concurrently
  const [locationReq, classesReq] = await Promise.all([
    locals.supabase.from("locations").select("settings").eq("id", locationId).single(),
    locals.supabase
      .from("classes")
      .select(`
        id, class_type, start_time, end_time, capacity, confirmed_bookings_count,
        coach:profiles!classes_coach_id_fkey ( display_name, avatar_url ),
        bookings ( 
          id, status, profile_id, created_at,
          profile:profiles!bookings_user_id_fkey ( display_name, avatar_url ) 
        )
      `)
      .eq("location_id", locationId)
      .gte("start_time", startOfDay(queryStartDate).toISOString())
      .order("start_time", { ascending: true })
  ]);

  if (locationReq.error) throw error(500, "Failed to load location settings.");
  if (classesReq.error) throw error(500, "Failed to load classes.");

  const classes = classesReq.data || [];

  const allCoaches = Array.from(
    new Set(
      classes.map((c) => c.coach?.display_name).filter((name): name is string => Boolean(name))
    )
  ).sort();

  const dbSettings = locationReq.data.settings as Partial<GymSettings> | null;
  const settings: GymSettings = {
    ...defaultSettings,
    ...dbSettings,
    policies: {
      ...defaultSettings.policies,
      ...dbSettings?.policies
    },
    schedulePrefs: {
      ...defaultSettings.schedulePrefs,
      ...dbSettings?.schedulePrefs
    }
  };

  const prefs = settings.schedulePrefs as Record<string, unknown> | undefined;
  const showCoach =
    (prefs?.showCoach as boolean | undefined)
    ?? (prefs?.show_coach as boolean | undefined)
    ?? ((settings as Record<string, unknown>)?.showCoach as boolean | undefined)
    ?? true;

  const showCoachFilter = showCoach && allCoaches.length > 1;

  const allClassTypes = (settings.classTypes || [])
    .filter((ct) => ct.isActive)
    .map((ct) => ct.name)
    .sort();

  const bounds = {
    min: (settings.schedulePrefs?.startHour ?? 6) * 60,
    max: (settings.schedulePrefs?.endHour ?? 22) * 60
  };

  const bookingOpens = settings.policies?.booking_opens ?? defaultSettings.policies.booking_opens;

  // 2. Evaluate temporal states, capacities, and attendee avatars
  const rawSchedule: ScheduledClass[] = classes.map((c) => {
    const openTime = calculateOpenTime(
      c.start_time,
      bookingOpens,
      membership.booking_delay_minutes ?? 0
    );

    const userBooking = c.bookings.find((b) => b.profile_id === userId && b.status !== "cancelled");
    const userStatus = (userBooking?.status as BookingStatus) || null;

    const confirmedBookings = c.bookings.filter((b) => b.status === "confirmed");
    const realAttendees: ClassAttendee[] = confirmedBookings.map((b) => ({
      id: b.id,
      avatarUrl: b.profile?.avatar_url ?? null,
      name: b.profile?.display_name ?? null
    }));

    // Mock attendees: random number minding class capacity
    const effectiveCapacity = c.capacity ?? 20;
    const mockCount = Math.floor(Math.random() * (effectiveCapacity + 1));
    const mockNames = [
      "Noa",
      "Kevin",
      "Sara",
      "Iker",
      "Lucía",
      "Diego",
      "Elena",
      "Marco",
      "Paula",
      "Hugo",
      "Nerea",
      "Adrián",
      "Carla",
      "Álex",
      "Irene",
      "Pol",
      "Rubén",
      "Clara",
      "Bruno",
      "Ona"
    ];
    const mockAttendees: ClassAttendee[] = Array.from({ length: mockCount }, (_, i) => ({
      id: `mock-${c.id}-${i + 1}`,
      avatarUrl: `https://i.pravatar.cc/150?u=athlete-${c.id}-${i + 1}`,
      name: mockNames[i % mockNames.length]
    }));

    const attendees = realAttendees.length > 0 ? realAttendees : mockAttendees;
    const confirmedBookingsCount =
      realAttendees.length > 0 ? c.confirmed_bookings_count : mockCount;

    // Filter and sort the waitlist by timestamp (FIFO)
    const waitlistBookings = c.bookings
      .filter((b) => b.status === "waitlist")
      .sort(
        (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
      );

    const waitlistTotal = waitlistBookings.length;
    let waitlistPosition: number | null = null;

    if (userStatus === "waitlist") {
      const idx = waitlistBookings.findIndex((b) => b.profile_id === userId);
      waitlistPosition = idx !== -1 ? idx + 1 : null;
    }

    const classTypeConfig = settings.classTypes?.find((ct) => ct.name === c.class_type);
    const classColor = classTypeConfig?.color ?? (settings as any)?.defaultClassColor ?? null;

    let duration = classTypeConfig?.defaultDuration ?? 60;
    if (c.end_time && c.start_time) {
      const diffMinutes = Math.round(
        (new Date(c.end_time).getTime() - new Date(c.start_time).getTime()) / (1000 * 60)
      );
      if (diffMinutes > 0) {
        duration = diffMinutes;
      }
    }

    return {
      id: c.id,
      class_type: c.class_type,
      start_time: c.start_time,
      duration,
      capacity: c.capacity,
      confirmed_bookings_count: confirmedBookingsCount,
      coach: c.coach,
      showCoach,
      bookings: c.bookings as BookingWithProfile[],
      attendees,
      openTime,
      userStatus,
      waitlistTotal,
      waitlistPosition,
      bookingOpensType: bookingOpens.type,
      cancellationWindowHours: settings.policies?.cancellation?.window_hours || 0,
      waitlistPolicy: settings.policies?.waitlist?.mode || "broadcast",
      color: classColor
    };
  });

  // 3. Filter classes before athlete joined gym (compare day of joining)
  const schedule = rawSchedule.filter((c) => {
    if (
      membership.created_at
      && isBefore(new Date(c.start_time), startOfDay(new Date(membership.created_at)))
    ) {
      return false;
    }
    return true;
  });

  return {
    activeLocation,
    location: activeLocation ? { ...activeLocation, settings } : null,
    settings,
    schedule,
    filterOptions: {
      allClassTypes,
      bounds,
      showCoachFilter,
      allCoaches
    }
  };
};

async function getBookingContext(supabase: SupabaseClient<Database>, classId: string) {
  const { data: targetClass, error: classError } = await supabase
    .from("classes")
    .select("start_time, location_id")
    .eq("id", classId)
    .single();

  if (classError || !targetClass) throw new Error("Class not found.");

  const { data: location, error: locError } = await supabase
    .from("locations")
    .select("settings")
    .eq("id", targetClass.location_id)
    .single();

  if (locError || !location) throw new Error("Location not found.");

  const dbSettings = location.settings as Partial<GymSettings> | null;
  return {
    targetClass,
    settings: {
      ...defaultSettings,
      ...dbSettings,
      policies: {
        ...defaultSettings.policies,
        ...dbSettings?.policies
      }
    } as GymSettings
  };
}

export const actions: Actions = {
  book: async ({ request, locals: { supabase, user } }) => {
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const classId = formData.get("classId")?.toString();

    if (!classId) return fail(400, { message: "Class ID is required." });

    try {
      const { targetClass, settings } = await getBookingContext(supabase, classId);
      const classTime = new Date(targetClass.start_time);
      const now = new Date();

      // 1. Prevent booking past classes
      if (classTime < now) {
        return fail(400, {
          message: "Cannot book a class that has already started."
        });
      }

      // 2. Prevent booking before the window opens
      const openTime = calculateOpenTime(classTime, settings.policies.booking_opens);
      if (now < openTime) {
        return fail(400, { message: "Booking window is not open yet." });
      }

      // 3. Hand off to the database for capacity and locking
      const { data, error } = await supabase.rpc("book_class", {
        p_profile_id: user.id,
        p_class_id: classId
      });

      if (error || !data) {
        console.error("Booking RPC error:", error);
        return fail(500, { message: "Could not secure your spot." });
      }

      const result = data as unknown as BookClassResult;
      return {
        success: true,
        status: result.status
      };
    } catch (err) {
      console.error("Context error:", err);
      return fail(500, { message: "Could not process booking request." });
    }
  },

  cancel: async ({ request, locals: { supabase, user } }) => {
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const classId = formData.get("classId")?.toString();

    if (!classId) return fail(400, { message: "Class ID is required." });

    try {
      const { targetClass } = await getBookingContext(supabase, classId);
      const classTime = new Date(targetClass.start_time);
      const now = new Date();

      // Check if the class has already passed
      if (classTime < now) {
        return fail(400, {
          message: "Cannot cancel a class that has already started."
        });
      }

      const { data, error } = await supabase.rpc("cancel_class", {
        p_profile_id: user.id,
        p_class_id: classId
      });

      if (error || !data) {
        console.error("Cancellation RPC error:", error);
        return fail(500, { message: "Failed to cancel booking." });
      }

      const result = data as unknown as CancelClassResult;
      if (!result.success) {
        return fail(400, { message: result.message || "Failed to cancel booking." });
      }

      return { success: true };
    } catch (err) {
      console.error("Context error:", err);
      return fail(500, { message: "Could not process cancellation request." });
    }
  }
};
