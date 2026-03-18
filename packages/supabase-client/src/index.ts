import { createClient } from "@supabase/supabase-js";
import type { Database } from "@wodapp/types";

/**
 * We export a function to create the client.
 * This allows us to pass different environment variables
 * depending on whether we are in the Athlete app or Admin app.
 */
export const createWodappClient = (supabaseUrl: string, supabaseKey: string) => {
  return createClient<Database>(supabaseUrl, supabaseKey);
};

// Also export the types for convenience
export * from "@supabase/supabase-js";
