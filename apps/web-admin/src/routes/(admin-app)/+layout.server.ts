import { error, redirect } from "@sveltejs/kit";

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
  const defaultSettings = {
    defaultClassColor: "#79706E",
    hiddenDays: [0],
    startHour: 6,
    endHour: 22,
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
    ]
  };

  const settings: App.GymSettings = locals.location.settings || defaultSettings;

  const visibleDayIndices = [1, 2, 3, 4, 5, 6, 0].filter((d) => !settings.hiddenDays.includes(d));

  const uniqueClassTypes = settings.classTypes
    .filter((ct: any) => ct.isActive) // Optional: hide archived classes
    .map((ct: any) => ct.name);

  const { data: coaches, error: coachesError } = await locals.supabase
    .from("memberships")
    .select("...profiles(id, full_name)")
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
