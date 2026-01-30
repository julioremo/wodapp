import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
    // If they already have a location, kick them to dashboard
    if (locals.location) throw redirect(303, '/');
};

export const actions = {
  default: async ({ request, locals }) => {
    const { user } = locals;
    if (!user) throw redirect(303, '/login');

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;

    // 1. Create Location
    const { data: location, error: locError } = await locals.supabase
      .from('locations')
      .insert({ name, slug })
      .select('id')
      .single();

    if (locError) return fail(400, { error: locError.message });

    // 2. Create Membership (Manager)
    const { error: memError } = await locals.supabase
      .from('memberships')
      .insert({
        profile_id: user.id,
        location_id: location.id,
        role: 'manager'
      });

    if (memError) return fail(500, { error: memError.message });

    // 3. Success -> Dashboard
    throw redirect(303, '/');
  }
};