import { createWodClient } from '@wodapp/supabase-client';
import { env } from '$env/dynamic/public';

// This is a singleton instance of the client
export const supabase = createWodClient(
  env.PUBLIC_SUPABASE_URL,
  env.PUBLIC_SUPABASE_ANON_KEY
);