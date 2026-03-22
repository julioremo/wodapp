import { error, fail } from "@sveltejs/kit";
import {
  subDays,
  set,
  isBefore,
  addSeconds,
  startOfDay,
  startOfWeek,
  subHours,
  subWeeks,
  setDay,
  parseISO,
  isAfter,
  subMinutes,
  format
} from "date-fns";
import { defaultSettings, type GymSettings } from "@wodapp/core";
import { enforcePenalty } from "@wodapp/core";

export const load = async ({ locals, url, parent }) => {
  const { user, activeLocation, memberships } = await parent();

  if (!activeLocation) {
    return { classes: [], filterOptions: { allClassTypes: [], bounds: { min: 0, max: 0 } } };
  }

  const userId = user.id;
  const locationId = activeLocation.id;
  const membership = memberships.find((m: any) => m.location_id === locationId);

  if (!membership) {
    throw error(403, "No active membership found for this location.");
  }

  // 2. Fetch settings and classes concurrently
  const [locationReq, classesReq] = await Promise.all([
    locals.supabase.from("locations").select("settings").eq("id", locationId).single(),
    locals.supabase
      .from("classes")
      .select(`
        id, class_type, start_time, capacity,
        coach:profiles!classes_coach_id_fkey ( display_name, avatar_url ),
        bookings ( 
          id, status, profile_id,
          profile:profiles!bookings_user_id_fkey ( avatar_url ) 
        )
      `)
      .eq("location_id", locationId)
      .gte("start_time", startOfDay(new Date()).toISOString())
      .order("start_time", { ascending: true })
  ]);

  if (locationReq.error) {
    throw error(500, "Failed to load scheduling context.");
  }

  const dbSettings = locationReq.data.settings as Partial<GymSettings> | null;
  const settings: GymSettings = {
    ...defaultSettings,
    ...dbSettings,
    schedulePrefs: {
      ...defaultSettings.schedulePrefs,
      ...(dbSettings?.schedulePrefs || {})
    },
    policies: {
      ...defaultSettings.policies,
      ...(dbSettings?.policies || {})
    }
  };
  const classes = classesReq.data || [];

  const allClassTypes = settings.classTypes
    .filter((ct) => ct.isActive)
    .map((ct) => ct.name)
    .sort();

  const bounds = {
    min: settings.schedulePrefs.startHour * 60,
    max: settings.schedulePrefs.endHour * 60
  };

  const bookingOpens = settings.policies.booking_opens;
  const schedulePrefs = settings.schedulePrefs;
  const now = new Date();

  // 3. Evaluate the temporal states and capacities
  const rawSchedule = classes.map((c) => {
    const classTime = new Date(c.start_time);
    let openTime = classTime;

    // A. Rolling Days Policy
    if (bookingOpens.type === "rolling_days" && bookingOpens.days !== null) {
      openTime = subDays(classTime, bookingOpens.days);
      if (bookingOpens.hour !== null) {
        openTime = set(openTime, {
          hours: bookingOpens.hour,
          minutes: 0,
          seconds: 0,
          milliseconds: 0
        });
      }
    }
    // B. Fixed Day Policy
    else if (
      bookingOpens.type === "fixed_day"
      && bookingOpens.dayOfWeek !== null
      && bookingOpens.hour !== null
    ) {
      const classWeekStart = startOfWeek(classTime, { weekStartsOn: 1 });
      const previousWeek = subWeeks(classWeekStart, 1);
      const targetDate = setDay(previousWeek, bookingOpens.dayOfWeek, { weekStartsOn: 1 });
      openTime = set(targetDate, {
        hours: bookingOpens.hour,
        minutes: 0,
        seconds: 0,
        milliseconds: 0
      });
    }
    // C. Immediate Policy
    else if (bookingOpens.type === "immediately") {
      openTime = new Date(0); // Opened at the dawn of time
    }

    // Apply personal penalty delay
    if (membership.booking_delay_minutes) {
      openTime = addSeconds(openTime, Math.round(membership.booking_delay_minutes * 60));
    }

    // Evaluate the user's specific booking
    const userBooking = c.bookings.find((b) => b.profile_id === userId);
    const userStatus = userBooking?.status || null; // 'confirmed', 'waitlist', or null

    // Evaluate capacity
    const confirmedCount = c.bookings.filter((b) => b.status === "confirmed").length;
    const isFull = c.capacity !== null && confirmedCount >= c.capacity;
    // Determine the exact UI state
    let uiState = "bookable";
    let buttonText = "Book";

    if (isBefore(classTime, now)) {
      uiState = "past";
    } else if (userStatus === "confirmed") {
      uiState = "booked";
      buttonText = "Cancel";
    } else if (userStatus === "waitlist") {
      uiState = "waitlist";
      buttonText = "Leave Waitlist";
    } else if (isBefore(now, openTime)) {
      uiState = "outside_window";
      // Format to something clean like "Opens Tue 6:00 AM"
      const formatString = openTime.toLocaleTimeString([], {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit"
      });
      buttonText = `Opens ${formatString}`;
    } else if (isFull) {
      uiState = "waitlist_available";
      buttonText = "Waitlist";
    }

    return {
      ...c,
      openTime,
      uiState,
      buttonText,
      confirmedCount,
      userStatus
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

  console.log("rawSchedule", rawSchedule[0]);
  console.log("schedulePrefs", schedulePrefs);
  console.log("schedule", schedule[0]);

  return {
    schedule,
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

      // Check current capacities to determine status
      const { data: currentBookings } = await locals.supabase
        .from("bookings")
        .select("status")
        .eq("class_id", classId);

      const confirmedCount = currentBookings?.filter((b) => b.status === "confirmed").length || 0;
      const waitlistCount = currentBookings?.filter((b) => b.status === "waitlist").length || 0;

      let newStatus: "confirmed" | "waitlist" = "confirmed";

      if (targetClass.capacity != null && confirmedCount >= targetClass.capacity) {
        if (!policies?.waitlist?.active) {
          return fail(400, { error: "Class is full and waitlist is not active." });
        }
        if (policies.waitlist.max_size != null && waitlistCount >= policies.waitlist.max_size) {
          return fail(400, { error: "Waitlist is at maximum capacity." });
        }
        newStatus = "waitlist";
      }

      const { error } = await locals.supabase.from("bookings").insert({
        class_id: classId,
        profile_id: locals.user.id,
        status: newStatus
      });

      if (error) {
        if (error.code === "23505") {
          return fail(400, { error: "You are already booked or on the waitlist." });
        }
        if (error.message.includes("maximum capacity")) {
          return fail(400, { error: "Class filled up just now. Please try joining the waitlist." });
        }
        return fail(500, { error: "Could not book class." });
      }

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

      if (policies?.cancellation?.active && policies.cancellation.window_hours != null) {
        const penaltyCutoff = subHours(startTime, policies.cancellation.window_hours);

        if (isAfter(now, penaltyCutoff)) {
          const penalty = policies.cancellation.penalty;

          if (penalty) {
            const initialStatus = penalty.needs_confirmation ? "pending_review" : "counted";

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
      }

      // Fetch the specific booking ID for the RPC
      const { data: booking } = await locals.supabase
        .from("bookings")
        .select("id")
        .match({ class_id: classId, profile_id: locals.user.id })
        .single();

      if (!booking) {
        return fail(400, { error: "Booking not found." });
      }

      // Execute cancellation and promotion state machine
      const { error } = await locals.supabase.rpc("cancel_booking_and_promote", {
        p_booking_id: booking.id
      });

      if (error) return fail(500, { error: "Could not cancel booking." });

      return { success: true };
    } catch (err: any) {
      return fail(400, { error: err.message });
    }
  }
};
