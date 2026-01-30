import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  // If logged in -> App
  if (locals.user) {
    throw redirect(303, '/schedule');
  }
  // If NOT logged in -> Login
  throw redirect(303, '/login');
};