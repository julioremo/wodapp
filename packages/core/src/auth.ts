import { createServerClient } from "@supabase/ssr";
import type { RequestEvent } from "@sveltejs/kit";
import type { SupabaseClient } from "@supabase/supabase-js";

export function setupSupabase(event: RequestEvent, supabaseUrl: string, supabaseKey: string) {
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: "/" });
        });
      }
    }
  });

  const safeGetSession = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) return { session: null, user: null };

    const {
      data: { user },
      error
    } = await supabase.auth.getUser();
    if (error) return { session: null, user: null };

    return { session, user };
  };

  return { supabase, safeGetSession };
}

export async function fetchUserContext(supabase: SupabaseClient, userId: string) {
  const { data: location } = await supabase
    .from("locations")
    .select(`
      id, name, slug, settings,
      memberships(role)
    `)
    .eq("memberships.profile_id", userId)
    .maybeSingle();

  if (!location) {
    return { location: null, userRole: null };
  }

  return {
    userRole: location.memberships[0]?.role ?? null,
    location: {
      id: location.id,
      name: location.name,
      slug: location.slug,
      settings: location.settings
    }
  };
}
