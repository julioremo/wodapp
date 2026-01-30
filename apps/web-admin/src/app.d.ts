import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
            // 👇 ADD THESE NEW FIELDS
			location: {
                id: string;
                name: string;
                slug: string;
            } | null;
			userRole: string | null;
		}
		interface PageData {
			session: Session | null;
		}
		// ... error, platform, etc.
	}
}

export {};
