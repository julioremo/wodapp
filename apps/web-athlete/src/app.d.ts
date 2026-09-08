import "vite-plugin-pwa/svelte";
import "vite-plugin-pwa/info";

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@wodapp/types";

declare global {
  declare const __DATE__: string;
  declare const __RELOAD_SW__: boolean;
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
      session: Session | null;
      user: User | null;
      location: {
        id: string;
        name: string;
        slug: string;
        settings: GymSettings | null;
      } | null;
      userRole: string | null;
    }
    interface PageData {
      session: Session | null;
    }
  }
}
