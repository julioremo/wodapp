import { fail, redirect } from '@sveltejs/kit';

export const actions = {
  accept: async ({ request, locals }) => {
    const data = await request.formData();
    const locationId = data.get('locationId');
    
    // 1. Update status to 'active'
    const { error: memberError } = await locals.supabase
      .from('memberships')
      .update({ status: 'active' })
      .match({ profile_id: locals.user.id, location_id: locationId })
      .select();
    
    if (memberError) {
      console.error("Membership Update Failed:", memberError);
      return fail(500, { error: "Failed to join gym. " + memberError.message });
    }

    // 2. Set as current location
    await locals.supabase
      .from('profiles')
      .update({ last_location_id: locationId })
      .eq('id', locals.user.id);
      
    throw redirect(303, '/schedule');
  },

  reject: async ({ request, locals }) => {
    // Update status to 'rejected'
    const data = await request.formData();
    await locals.supabase.from('memberships').update({ status: 'rejected' })
      .match({ profile_id: locals.user.id, location_id: data.get('locationId') });
      
    // Reload page (which will then redirect to dashboard if no other invites exist)
    return { success: true }; 
  }
};