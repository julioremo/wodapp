import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

declare global {
  namespace App {
    interface GymSettings {
      defaultClassColor: string;
      hiddenDays: number[];
      startHour: number;
      endHour: number;
      classTypes: {
        name: string;
        color: string;
        isProgrammable: boolean;
        isActive: boolean;
        defaultCoachId: string | null;
        defaultDuration: number;
        defaultCapacity: number;
      }[];
    }
    interface Locals {
      supabase: SupabaseClient;
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
