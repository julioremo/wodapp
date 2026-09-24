import { json, type RequestHandler } from "@sveltejs/kit";
import { endOfMonth, parse, startOfMonth } from "date-fns";
import type { AttendanceItem } from "../../types";

export const GET: RequestHandler = async ({ url, locals }) => {
  const { user, supabase } = locals;
  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const monthParam = url.searchParams.get("month"); // e.g. "2026-06"
  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    return json({ error: "Invalid month format. Expected YYYY-MM" }, { status: 400 });
  }

  const locationId = url.searchParams.get("locationId");
  if (!locationId) {
    return json({ error: "Location ID is required" }, { status: 400 });
  }

  let targetDate: Date;
  try {
    targetDate = parse(monthParam, "yyyy-MM", new Date());
    if (Number.isNaN(targetDate.getTime())) {
      return json({ error: "Invalid date" }, { status: 400 });
    }
  } catch {
    return json({ error: "Failed to parse month" }, { status: 400 });
  }

  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);

  const { data: bookings, error: dbError } = await supabase
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
    .eq("profile_id", user.id)
    .eq("classes.location_id", locationId)
    .eq("status", "confirmed")
    .gte("classes.start_time", monthStart.toISOString())
    .lte("classes.start_time", monthEnd.toISOString());

  if (dbError) {
    console.error("Error loading monthly bookings:", dbError);
    return json({ error: "Database error" }, { status: 500 });
  }

  const rawBookings = bookings || [];
  const items: AttendanceItem[] = rawBookings.map((b) => {
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

  items.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return json({
    month: monthParam,
    bookings: items
  });
};
