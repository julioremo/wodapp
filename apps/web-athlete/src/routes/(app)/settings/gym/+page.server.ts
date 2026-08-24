// src/routes/settings/gym/+page.server.ts
import { fail } from "@sveltejs/kit";
import { activeGymSchema } from "@wodapp/core"; // Your Zod 4 schema

export const load = async ({ parent }) => {
  // Grab the data already fetched by your root +layout.server.ts!
  const { memberships, profile, activeLocation } = await parent();

  // Filter down to only active memberships so they can't select a gym they aren't part of
  const activeMemberships = memberships.filter((m) => m.status === "active");

  return {
    activeMemberships,
    currentLocationId: activeLocation?.id || profile?.last_location_id
  };
};

export const actions = {
  updateActiveGym: async ({ request, locals: { supabase, user } }) => {
    // Guard clause using your locals setup
    if (!user) return fail(401, { message: "Unauthorized" });

    const formData = Object.fromEntries(await request.formData());

    // 1. Zod 4 Validation
    const parsed = activeGymSchema.safeParse(formData);

    if (!parsed.success) {
      return fail(400, {
        errors: parsed.error.flatten().fieldErrors
      });
    }

    // 2. Database Update
    const { error } = await supabase
      .from("profiles")
      .update({ last_location_id: parsed.data.last_location_id })
      .eq("id", user.id);

    if (error) {
      return fail(500, { message: "Failed to update active gym." });
    }

    return { success: true };
  }
};
