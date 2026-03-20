import type { Handle } from "@sveltejs/kit";
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from "$env/static/public";
import { setupSupabase, fetchUserContext } from "@wodapp/core";
import type { GymSettings } from "@wodapp/core";

export const handle: Handle = async ({ event, resolve }) => {
  const { supabase, safeGetSession } = setupSupabase(
    event,
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY
  );

  event.locals.supabase = supabase;
  event.locals.safeGetSession = safeGetSession;

  const { session, user } = await event.locals.safeGetSession();
  event.locals.session = session;
  event.locals.user = user;

  event.locals.location = null;
  event.locals.userRole = null;

  if (user) {
    const context = await fetchUserContext(event.locals.supabase, user.id);
    event.locals.userRole = context.userRole;

    if (context.location) {
      event.locals.location = {
        ...context.location,
        settings: context.location.settings as unknown as GymSettings
      };
    }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === "content-range" || name === "x-supabase-api-version";
    }
  });
};
