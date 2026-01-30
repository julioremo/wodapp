import { fail, redirect } from '@sveltejs/kit';

export const actions = {
  login: async ({ request, locals }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await locals.supabase.auth.signInWithPassword({ email, password });

    if (error) return fail(401, { error: 'Invalid credentials' });

    throw redirect(303, '/');
  },

  signup: async ({ request, locals }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
    });

    if (error) return fail(500, { error: error.message });
    
    // If Email Confirmation is OFF, this logs them in immediately.
    if (data.session) {
        throw redirect(303, '/setup'); // 👈 Direct them to Setup
    }

    return { success: true, message: "Please check your email to confirm your account." };
  }
};