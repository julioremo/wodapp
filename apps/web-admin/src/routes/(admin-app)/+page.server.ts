import { fail } from "@sveltejs/kit";
import { enforcePenalty } from "@wodapp/core";
import type { GymSettings } from "@wodapp/core";

export const load = async ({ locals }) => {
  // Fetch only pending infractions for the active location
  const { data: pendingInfractions } = await locals.supabase
    .from("infractions")
    .select(`
      id,
      reason,
      created_at,
      profile:profiles(display_name),
      class:classes(start_time, name)
    `)
    .eq("location_id", locals.location.id)
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  // const { data: memberships } = await locals.supabase
  //   .from("memberships")
  //   .select("role, locations(*)")
  //   .eq("profile_id", user.id);

  return {
    // memberships: memberships ?? [],
    pendingInfractions: pendingInfractions || []
  };
};

export const actions = {
  resolveInfraction: async ({ request, locals }) => {
    const formData = await request.formData();
    const infractionId = formData.get("infractionId") as string;
    const resolution = formData.get("resolution") as "counted" | "waived";

    if (!locals.userRole || !["admin", "manager"].includes(locals.userRole)) {
      return fail(403, { error: "Unauthorized" });
    }

    // 1. Fetch the infraction details to know what rule to check
    const { data: infraction, error: fetchError } = await locals.supabase
      .from("infractions")
      .select("profile_id, location_id, reason")
      .eq("id", infractionId)
      .single();

    if (fetchError || !infraction) return fail(404, { error: "Infraction not found." });

    // 2. Update the status
    const { error: updateError } = await locals.supabase
      .from("infractions")
      .update({ status: resolution })
      .eq("id", infractionId);

    if (updateError) return fail(500, { error: "Failed to update record." });

    // 3. Evaluate penalties if the manager chose to count it as a strike
    if (resolution === "counted") {
      const { data: location } = await locals.supabase
        .from("locations")
        .select("settings")
        .eq("id", infraction.location_id)
        .single();

      const settings = (location?.settings || {}) as GymSettings;
      const policies = settings.policies;

      // Determine which policy applies based on the infraction reason
      const policyMatch =
        infraction.reason === "late_cancel" ? policies?.cancellation : policies?.no_show;
      const penalty = policyMatch?.penalty;

      if (penalty) {
        const { data: activeInfractions } = await locals.supabase
          .from("infractions")
          .select("id")
          .match({
            profile_id: infraction.profile_id,
            location_id: infraction.location_id,
            reason: infraction.reason,
            status: "counted"
          });

        if (activeInfractions && activeInfractions.length >= penalty.strikes) {
          const infractionIds = activeInfractions.map((i) => i.id);

          try {
            await enforcePenalty(
              locals.supabase,
              infraction.profile_id,
              infraction.location_id,
              penalty,
              infractionIds
            );
          } catch (error: any) {
            console.error("Penalty enforcement failed:", error);
            return fail(500, { error: "Strike counted, but failed to apply automatic penalty." });
          }
        }
      }
    }

    return { success: true };
  }
};
