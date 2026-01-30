import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  // 1. Use the Authenticated User & Client from locals
  const { user, supabase } = locals; 

  if (!user) throw redirect(303, '/login');

  // 2. Fetch data using the AUTHENTICATED client
  // Since we already know the user is logged in, this query will now work.
  const { data: memberships } = await supabase
    .from('memberships')
    .select('role, locations(*)')
    .eq('profile_id', user.id);

  return { memberships: memberships ?? [] };
};