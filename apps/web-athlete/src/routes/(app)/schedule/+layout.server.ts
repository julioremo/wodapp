import { error, redirect } from "@sveltejs/kit";
import { defaultSettings, type GymSettings } from "@wodapp/core";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ parent }) => {
  const { user, activeLocation, memberships, settings: parentSettings } = await parent();

  if (!user) {
    throw redirect(303, "/login");
  }

  if (!activeLocation) {
    return {
      membership: null,
      membershipJoinedAt: null,
      settings: defaultSettings,
      bookingOpens: defaultSettings.policies.booking_opens,
      bounds: { min: 360, max: 1320 },
      allClassTypes: [] as string[],
      showCoach: true
    };
  }

  const membership = memberships?.find((m) => m.location_id === activeLocation.id);
  if (!membership) {
    throw error(403, "No active membership found for this location.");
  }

  const membershipJoinedAt = membership.created_at ?? new Date().toISOString();

  // Use normalized settings from parent layout or fallback
  const settings: GymSettings = parentSettings ?? (activeLocation.settings as GymSettings) ?? defaultSettings;

  const prefs = settings.schedulePrefs as Record<string, unknown> | undefined;
  const showCoach =
    (prefs?.showCoach as boolean | undefined)
    ?? (prefs?.show_coach as boolean | undefined)
    ?? ((settings as Record<string, unknown>)?.showCoach as boolean | undefined)
    ?? true;

  const allClassTypes = (settings.classTypes || [])
    .filter((ct) => ct.isActive)
    .map((ct) => ct.name)
    .sort();

  const bounds = {
    min: (settings.schedulePrefs?.startHour ?? 6) * 60,
    max: (settings.schedulePrefs?.endHour ?? 22) * 60
  };

  const bookingOpens = settings.policies?.booking_opens ?? defaultSettings.policies.booking_opens;

  return {
    membership,
    membershipJoinedAt,
    settings,
    bookingOpens,
    bounds,
    allClassTypes,
    showCoach
  };
};
