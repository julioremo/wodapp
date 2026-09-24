import { error, redirect } from "@sveltejs/kit";
import { defaultSettings } from "@wodapp/core";
import {
  endOfMonth,
  format,
  isBefore,
  max,
  parse,
  startOfDay,
  startOfMonth,
  subMonths
} from "date-fns";
import type { AttendanceItem } from "../types";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { user, activeLocation, membership, membershipJoinedAt, settings } = await parent();

  if (!user) {
    throw redirect(303, "/login");
  }

  if (!activeLocation || !membership) {
    return {
      activeLocation: null,
      membershipJoinedAt: null,
      targetMonth: format(new Date(), "yyyy-MM"),
      initialBookings: [] as AttendanceItem[],
      initialLoadedMonths: [] as string[],
      settings: defaultSettings
    };
  }

  const userId = user.id;
  const locationId = activeLocation.id;
  const joinDate = startOfDay(new Date(membershipJoinedAt ?? new Date()));

  // Determine target month from URL parameter or default to current month
  let targetDate = new Date();
  const targetMonthStr = format(targetDate, "yyyy-MM");

  // Initial load range:
  // "bookings for the future + current month + previous 3 months"
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const threeMonthsAgoStart = subMonths(currentMonthStart, 3);

  // If targetMonth is earlier than 3 months ago, include targetMonth start as well
  const targetMonthStart = startOfMonth(targetDate);
  const earliestRequested = isBefore(targetMonthStart, threeMonthsAgoStart)
    ? targetMonthStart
    : threeMonthsAgoStart;

  // The calendar should only go back as far as to the date the user joined the location
  const queryStartDate = max([earliestRequested, joinDate]);

  // Fetch confirmed bookings (past and future)
  const { data: bookingsData, error: bookingsError } = await locals.supabase
    .from("bookings")
    .select(`
      id,
      status,
      classes!inner (
        id,
        start_time,
        class_type,
        location_id,
        coach:profiles!classes_coach_id_fkey ( display_name )
      )
    `)
    .eq("profile_id", userId)
    .eq("classes.location_id", locationId)
    .eq("status", "confirmed")
    .gte("classes.start_time", startOfDay(queryStartDate).toISOString());

  if (bookingsError) {
    console.error("Calendar bookings fetch error:", bookingsError);
  }

  const rawBookings = bookingsData || [];
  const initialBookings: AttendanceItem[] = rawBookings.map((b) => {
    const classData = Array.isArray(b.classes) ? b.classes[0] : b.classes;
    const coachData = Array.isArray(classData.coach) ? classData.coach[0] : classData.coach;
    return {
      id: b.id,
      classId: classData.id,
      type: classData.class_type,
      startTime: classData.start_time,
      coachName: coachData?.display_name ?? null
    };
  });

  // Fast in-memory sort by start time (avoids expensive PostgREST correlated subquery)
  initialBookings.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Calculate the months that are covered by this query
  const loadedMonthsList: string[] = [];
  let cur = startOfMonth(queryStartDate);
  const curEnd = endOfMonth(now);
  while (cur <= curEnd) {
    loadedMonthsList.push(format(cur, "yyyy-MM"));
    cur = startOfMonth(new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
  }
  if (!loadedMonthsList.includes(targetMonthStr)) {
    loadedMonthsList.push(targetMonthStr);
  }

  return {
    activeLocation,
    membershipJoinedAt,
    targetMonth: targetMonthStr,
    initialBookings,
    initialLoadedMonths: loadedMonthsList,
    settings
  };
};
