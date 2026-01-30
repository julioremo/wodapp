import { fail } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  // Fetch all members for this location
  const { data: members } = await locals.supabase
    .from('memberships')
    .select(`
      role, 
      status, 
      profile:profiles(full_name, email)
    `)
    .eq('location_id', locals.location.id)
    .order('status', { ascending: false }); // Pending first (usually)

  return { members: members ?? [] };
};

export const actions = {
  invite: async ({ request, locals }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;

    // Call the SQL function we created
    const { error } = await locals.supabase
      .rpc('invite_athlete', {
        user_email: email,
        loc_id: locals.location.id
      });

    if (error) {
      return fail(400, { error: error.message });
    }

    return { success: true };
  }
};