import { redirect, error } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
  const { user, supabase } = locals;
  if (!user) throw redirect(303, '/login');

  // 1. Fetch User Profile (for last_location_id) + All Memberships
  const { data: profile } = await supabase
    .from('profiles')
    .select('last_location_id')
    .eq('id', user.id)
    .maybeSingle();

  // 'memberships' is strictly 'Membership[]', or null if there's a db error
  const { data: memberships, error: dbError} = await supabase
    .from('memberships')
    .select(`
      status,
      location_id,
      location:locations ( id, name, slug )
    `)
    .eq('profile_id', user.id);

  if (dbError) {
    console.error("Membership Fetch Error:", dbError);
    throw error(500, "Could not load your memberships.");
  }

  // === SCENARIO 3: PENDING INVITATIONS (Blocking) ===
  // If we have a pending invite, we hijack the flow and force a decision.
  // (Unless we are already ON the invitation page)
  // Note: memberships might be empty [], but that's valid (New User).
  const pendingInvite = memberships.find(m => m.status === 'pending');
  if (pendingInvite && !url.pathname.startsWith('/invitation')) {
    throw redirect(303, `/invitation`);
  }

  // === SCENARIO 1, 2, 4: DETERMINING ACTIVE LOCATION ===
  const activeMemberships = memberships.filter(m => m.status === 'active');
  let activeLocation = null;

  if (activeMemberships.length === 1) {
    // SCENARIO 1: Only one gym -> Use it.
    activeLocation = activeMemberships[0].location;
  } else if (activeMemberships.length > 1) {
    // SCENARIO 2: Multiple gyms -> Try 'last_location_id', else default to first.
    const lastUsed = activeMemberships.find(m => m.location.id === profile?.last_location_id);
    activeLocation = lastUsed ? lastUsed.location : activeMemberships[0].location;
  }
  // SCENARIO 4: No active gyms -> activeLocation remains null.

  return {
    user,
    activeLocation,      // The gym we are currently looking at (or null)
    memberships
  };
};