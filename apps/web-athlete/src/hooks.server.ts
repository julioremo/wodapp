import type { SupabaseClient } from "@supabase/supabase-js";
import type { Handle } from "@sveltejs/kit";
import { setupSupabase } from "@wodapp/core";
import type { Database } from "@wodapp/types";
import {
  PUBLIC_SUPABASE_ANON_KEY,
  PUBLIC_SUPABASE_URL,
} from "$env/static/public";

export const handle: Handle = async ({ event, resolve }) => {
  const { supabase, safeGetSession } = setupSupabase(
    event,
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
  );

  event.locals.supabase = supabase as SupabaseClient<Database>;
  event.locals.safeGetSession = safeGetSession;

  const { session, user } = await event.locals.safeGetSession();
  event.locals.session = session;
  event.locals.user = user;

  event.locals.location = null;
  event.locals.userRole = null;

  return resolve(event, {
    filterSerializedResponseHeaders: (name) => name === "content-range",
  });
};
