import { redirect, error } from "@sveltejs/kit";

export const load = async ({ locals, url }) => {
  const { user, supabase } = locals;

  // Guard the entire (app) group
  if (!user) throw redirect(303, "/login");

  // 1. Fetch Profile and Memberships (concurrently)
  const [profileReq, membershipsReq] = await Promise.all([
    supabase.from("profiles").select("last_location_id").eq("id", user.id).single(),
    supabase
      .from("memberships")
      .select(`
        status,
        location_id,
        created_at,
        booking_delay_minutes,
        location:locations ( id, name, slug )
      `)
      .eq("profile_id", user.id)
  ]);

  if (membershipsReq.error) {
    console.error("Membership Fetch Error:", membershipsReq.error);
    throw error(500, "Could not load your memberships.");
  }

  const memberships = membershipsReq.data || [];
  const profile = profileReq.data;

  // === SCENARIO 3: PENDING INVITATIONS (Blocking) ===
  const pendingInvite = memberships.find((m) => m.status === "pending");
  if (pendingInvite && !url.pathname.startsWith("/invitation")) {
    throw redirect(303, `/invitation`);
  }

  // === SCENARIO 1, 2, 4: DETERMINING ACTIVE LOCATION ===
  const activeMemberships = memberships.filter((m) => m.status === "active");
  let activeLocation = null;

  if (activeMemberships.length === 1) {
    activeLocation = activeMemberships[0].location;
  } else if (activeMemberships.length > 1) {
    const lastUsed = activeMemberships.find((m) => m.location.id === profile?.last_location_id);
    activeLocation = lastUsed ? lastUsed.location : activeMemberships[0].location;
  }

  // === SCENARIO 4: NO GYM ===
  // Prevent them from entering the app with a null location context
  //if (!activeLocation && !url.pathname.startsWith("/join")) {
  // throw redirect(303, '/join'); // Assuming you have a route to find a gym
  //}

  return {
    user,
    activeLocation,
    memberships
  };
};
