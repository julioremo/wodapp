import { fail, redirect } from '@sveltejs/kit';

export const actions = {
  // Action to switch the active gym
  switchGym: async ({ request, locals }) => {
    const formData = await request.formData();
    const locationId = formData.get('locationId') as string;

    if (!locationId) return fail(400, { error: 'No location specified' });

    // Update the user's "Last Location" preference in the database
    const { error } = await locals.supabase
      .from('profiles')
      .update({ last_location_id: locationId })
      .eq('id', locals.user!.id);

    if (error) return fail(500, { error: 'Failed to switch gym' });

    // Redirect to Schedule to immediately see the new gym's context
    throw redirect(303, '/schedule');
  },

  // Action to Sign Out
  logout: async ({ locals }) => {
    const { error } = await locals.supabase.auth.signOut();
    if (error) return fail(500, { error: 'Logout failed' });
    
    throw redirect(303, '/login');
  }
};