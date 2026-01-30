import { redirect, error } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  // 1. Auth Check
  if (!locals.user) throw redirect(303, '/login');

  // 2. Setup Check
  // If they have no gym, they MUST go to setup.
  if (!locals.location) {
     throw redirect(303, '/setup'); 
  }

  // 3. Role Check
  const role = locals.userRole; // This comes from our hook
  if (!['admin', 'manager', 'coach'].includes(role)) {
    throw error(403, 'Access Denied: You are not staff.');
  }

  return {
    user: locals.user,
    location: locals.location,
    userRole: role
  };
};