import { error, redirect } from "@sveltejs/kit";
import type { GymSettings } from "@wodapp/types";

export const load = async ({ locals }) => {
  // 1. Auth Check
  if (!locals.user) throw redirect(303, "/login");

  // 2. Setup Check
  if (!locals.location) {
    throw redirect(303, "/setup");
  }

  // 3. Role Check
  const role = locals.userRole; // This comes from hooks
  if (!role || !["admin", "manager", "coach"].includes(role)) {
    throw error(403, "Access Denied: You are not staff.");
  }

  // Provide a safe fallback structure if the database column is empty
  const defaultSettings: GymSettings = {
    schedulePrefs: {
      hiddenDays: [0],
      startHour: 6,
      endHour: 22
    },
    classTypes: [
      {
        name: "CrossFit",
        color: "#4E79A7",
        isProgrammable: true,
        isActive: true,
        defaultCoachId: null,
        defaultDuration: 60,
        defaultCapacity: 15
      },
      {
        name: "Weightlifting",
        color: "#F28E2B",
        isProgrammable: false,
        isActive: true,
        defaultCoachId: null,
        defaultDuration: 60,
        defaultCapacity: 15
      },
      {
        name: "Gymnastics",
        color: "#59A14F",
        isProgrammable: true,
        isActive: true,
        defaultCoachId: null,
        defaultDuration: 60,
        defaultCapacity: 15
      },
      {
        name: "Open Box",
        color: "#79706E",
        isProgrammable: false,
        isActive: true,
        defaultCoachId: null,
        defaultDuration: 60,
        defaultCapacity: 15
      }
    ],
    policies: {
      booking_opens: {
        type: "rolling_days",
        days: 7,
        dayOfWeek: null,
        hour: null
      },
      booking_closes: {
        active: true,
        minutes_prior: 60
      },
      cancellation: {
        active: false,
        window_hours: null,
        penalty: {
          type: "credit_deduction",
          strikes: 1
        }
      },
      no_show: {
        active: false,
        penalty: {
          type: "credit_deduction",
          strikes: 1
        }
      },
      waitlist: {
        active: true,
        max_size: null,
        mode: "broadcast",
        auto_enroll_cutoff_hours: null
      }
    }
  };

  const settings: GymSettings = locals.location.settings || defaultSettings;

  const visibleDayIndices = [1, 2, 3, 4, 5, 6, 0].filter(
    (d) => !settings.schedulePrefs.hiddenDays.includes(d)
  );

  const uniqueClassTypes = settings.classTypes
    .filter((ct: any) => ct.isActive)
    .map((ct: any) => ct.name);

  const { data: coaches, error: coachesError } = await locals.supabase
    .from("memberships")
    .select("...profiles(id, display_name)")
    .eq("location_id", locals.location?.id)
    .in("role", ["coach", "manager", "admin"]);

  if (coachesError) {
    console.error("Failed to load coaches:", coachesError);
  }

  return {
    user: locals.user,
    location: locals.location,
    userRole: role,
    settings,
    visibleDayIndices,
    uniqueClassTypes,
    coaches: coaches || []
  };
};
