import { error, redirect } from "@sveltejs/kit";
import { type GymSettings, defaultSettings } from "@wodapp/core";

export const load = async ({ locals }) => {
  // 1. Auth Check
  if (!locals.user) throw redirect(303, "/login");

  // 2. Setup Check
  if (!locals.location) {
    throw redirect(303, "/setup");
  }

  // 3. Role Check
  const role = locals.userRole;
  if (!role || !["admin", "manager", "coach"].includes(role)) {
    throw error(403, "Access Denied: You are not staff.");
  }

  // Safely merge DB settings with defaults to prevent missing keys on older JSON records
  const dbSettings = locals.location.settings as Partial<GymSettings> | null;

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
    // Note: classTypes usually replaces entirely rather than merging arrays, so ...dbSettings handles it.
  };

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
