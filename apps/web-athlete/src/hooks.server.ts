import type { Handle } from "@sveltejs/kit";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public";
import { setupSupabase } from "@wodapp/core";

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

  return resolve(event, {
    filterSerializedResponseHeaders: (name) => name === "content-range"
  });
};
