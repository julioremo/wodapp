import { error, fail } from "@sveltejs/kit";
import type { Actions } from "./$types";
import {
  addSeconds,
  format,
  isAfter,
  isBefore,
  parseISO,
  set,
  setDay,
  startOfDay,
  startOfWeek,
  subDays,
  subHours,
  subMinutes,
  subWeeks,
} from "date-fns";
import { defaultSettings, type GymSettings } from "@wodapp/core";
import { enforcePenalty } from "@wodapp/core";
import { calculateOpenTime } from "@wodapp/core";

export const load = async ({ locals, url, parent }) => {
  const { user, activeLocation, memberships } = await parent();

  if (!activeLocation) {
    return {
      classes: [],
      filterOptions: { allClassTypes: [], bounds: { min: 0, max: 0 } },
    };
  }

  const userId = user.id;
  const locationId = activeLocation.id;
  const membership = memberships.find((m: any) => m.location_id === locationId);

  if (!membership) {
    throw error(403, "No active membership found for this location.");
  }

  // 2. Fetch settings and classes concurrently
  const [locationReq, classesReq] = await Promise.all([
    locals.supabase.from("locations").select("settings").eq("id", locationId)
      .single(),
    locals.supabase
      .from("classes")
      .select(`
        id, class_type, start_time, capacity, confirmed_bookings_count,
        coach:profiles!classes_coach_id_fkey ( display_name, avatar_url ),
        bookings ( 
          id, status, profile_id, created_at,
          profile:profiles!bookings_user_id_fkey ( avatar_url ) 
        )
      `)
      .eq("location_id", locationId)
      .gte("start_time", startOfDay(new Date()).toISOString())
      .order("start_time", { ascending: true }),
  ]);

  if (locationReq.error) throw error(500, "Failed to load location settings.");
  if (classesReq.error) throw error(500, "Failed to load classes.");

  const classes = classesReq.data || [];

  const allCoaches = Object.keys(
    classes.reduce((acc: Record<string, boolean>, curr) => {
      if (curr.coach?.display_name) acc[curr.coach.display_name] = true;
      return acc;
    }, {}),
  ).sort();

  const classesByType = Object.groupBy(classes, (c) => c.class_type);
  const showCoachFilter = Object.values(classesByType).some((g) =>
    new Set(g.map((c) => c.coach?.display_name).filter(Boolean)).size > 1
  );

  const dbSettings = locationReq.data.settings as Partial<GymSettings> | null;
  const settings: GymSettings = {
    ...defaultSettings,
    ...dbSettings,
  };

  console.log("settings", settings);

  const allClassTypes = settings.classTypes
    .filter((ct) => ct.isActive)
    .map((ct) => ct.name)
    .sort();

  const bounds = {
    min: settings.schedulePrefs.startHour * 60,
    max: settings.schedulePrefs.endHour * 60,
  };

  const bookingOpens = settings.policies.booking_opens;
  // const schedulePrefs = settings.schedulePrefs;
  // const now = new Date();

  // 3. Evaluate the temporal states and capacities
  const rawSchedule = classes.map((c) => {
    const openTime = calculateOpenTime(
      c.start_time,
      bookingOpens,
      membership.booking_delay_minutes,
    );

    const userBooking = c.bookings.find(
      (b: any) => b.profile_id === userId && b.status !== "cancelled",
    );
    const userStatus = userBooking?.status || null;

    // Filter and sort the waitlist by timestamp (FIFO)
    const waitlistBookings = c.bookings
      .filter((b: any) => b.status === "waitlist")
      .sort((a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

    const waitlistTotal = waitlistBookings.length;
    let waitlistPosition = null;

    if (userStatus === "waitlist") {
      waitlistPosition = waitlistBookings.findIndex((b: any) =>
        b.profile_id === userId
      ) + 1;
    }

    return {
      ...c,
      openTime,
      userStatus,
      waitlistTotal,
      waitlistPosition,
      bookingOpensType: bookingOpens.type,
      cancellationWindowHours: settings.policies.cancellation.window_hours || 0,
      waitlistPolicy: settings.policies.waitlist.mode,
    };
  });

  // 4. Filter the array based on rules before returning
  const schedule = rawSchedule.filter((c) => {
    // Drop classes before they joined the gym
    if (isBefore(new Date(c.start_time), new Date(membership.created_at!))) {
      return false;
    }
    // Drop future classes if the manager disabled visibility
    // if (c.uiState === "outside_window" && !schedulePrefs.show_schedule_outside_window) {
    //   return false;
    // }

    return true;
  });

  return {
    schedule,
    filterOptions: {
      allClassTypes,
      bounds,
      showCoachFilter,
      allCoaches,
    },
  };
};

async function getBookingContext(supabase: any, classId: string) {
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

  return {
    targetClass,
    settings: (location.settings || {}) as GymSettings,
  };
}

export const actions: Actions = {
  book: async ({ request, locals: { supabase, user } }) => {
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const classId = formData.get("classId")?.toString();

    if (!classId) return fail(400, { message: "Class ID is required." });

    try {
      const { targetClass, settings } = await getBookingContext(
        supabase,
        classId,
      );
      const classTime = new Date(targetClass.start_time);
      const now = new Date();

      // 1. Prevent booking past classes
      if (classTime < now) {
        return fail(400, {
          message: "Cannot book a class that has already started.",
        });
      }

      // 2. Prevent booking before the window opens
      const openTime = calculateOpenTime(
        classTime,
        settings.policies.booking_opens,
      );
      if (now < openTime) {
        return fail(400, { message: "Booking window is not open yet." });
      }

      // 3. Hand off to the database for capacity and locking
      const { data, error } = await supabase.rpc("book_class", {
        p_profile_id: user.id,
        p_class_id: classId,
      });

      if (error) {
        console.error("Booking RPC error:", error);
        return fail(500, { message: "Could not secure your spot." });
      }

      return {
        success: true,
        status: data.status,
      };
    } catch (err: any) {
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
      const { targetClass, settings } = await getBookingContext(
        supabase,
        classId,
      );
      const classTime = new Date(targetClass.start_time);
      const now = new Date();

      // Check if the class has already passed
      if (classTime < now) {
        return fail(400, {
          message: "Cannot cancel a class that has already started.",
        });
      }

      // Optional: Check late cancellation window based on your JSON settings
      // const cancelWindowHours = settings.policies.cancellation_window_hours || 0;
      // const cutoffTime = new Date(classTime.getTime() - cancelWindowHours * 60 * 60 * 1000);
      // if (now > cutoffTime) {
      //   // Handle late cancellation logic here (e.g., apply a penalty or block the action)
      // }

      const { data, error } = await supabase.rpc("cancel_class", {
        p_profile_id: user.id,
        p_class_id: classId,
      });

      if (error) {
        console.error("Cancellation RPC error:", error);
        return fail(500, { message: "Failed to cancel booking." });
      }

      if (!data.success) {
        return fail(400, { message: data.message });
      }

      return { success: true };
    } catch (err: any) {
      console.error("Context error:", err);
      return fail(500, { message: "Could not process cancellation request." });
    }
  },
};
