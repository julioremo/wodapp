import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
  // 1. Initialize Supabase
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            event.cookies.set(name, value, { ...options, path: '/' })
          );
        },
      },
    }
  );

  // 2. Safe Session Fetch
  event.locals.safeGetSession = async () => {
		const {
			data: { session },
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error,
		} = await event.locals.supabase.auth.getUser();
		if (error) {
			return { session: null, user: null };
		}

		return { session, user };
	};

  const { session, user } = await event.locals.safeGetSession();
  event.locals.session = session;
	event.locals.user = user;

      // 3. GLOBAL LOCATION FETCH
    event.locals.location = null;
    event.locals.userRole = null;

    if (user) {
        // We use .maybeSingle() because if they don't have a location yet (new signup),
        // we don't want to crash the whole server—we just want null.
        const { data: location } = await event.locals.supabase
            .from('locations')
            .select(`
                id, name, slug,
                memberships(role)
            `)
            .eq('memberships.profile_id', user.id)
            .maybeSingle();
        
        if (location) {
            // Flatten the structure for easier access
            event.locals.userRole = location.memberships[0]?.role ?? null;
            event.locals.location = {
                id: location.id,
                name: location.name,
                slug: location.slug
            };
        }
    }

  return resolve(event, {
    filterSerializedResponseHeaders: (name) => name === 'content-range',
  });
};