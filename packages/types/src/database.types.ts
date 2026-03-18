export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          profile_id: string
          status: Database["public"]["Enums"]["booking_status"] | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          profile_id: string
          status?: Database["public"]["Enums"]["booking_status"] | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          capacity: number | null
          class_type: string
          coach_id: string | null
          created_at: string | null
          end_time: string
          id: string
          location_id: string
          program_id: string | null
          start_time: string
        }
        Insert: {
          capacity?: number | null
          class_type?: string
          coach_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          location_id: string
          program_id?: string | null
          start_time: string
        }
        Update: {
          capacity?: number | null
          class_type?: string
          coach_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          location_id?: string
          program_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_programme_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      infractions: {
        Row: {
          class_id: string
          created_at: string
          id: string
          location_id: string
          notes: string | null
          profile_id: string
          reason: Database["public"]["Enums"]["infraction_reason"]
          status: Database["public"]["Enums"]["infraction_status"]
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          location_id: string
          notes?: string | null
          profile_id: string
          reason: Database["public"]["Enums"]["infraction_reason"]
          status?: Database["public"]["Enums"]["infraction_status"]
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          location_id?: string
          notes?: string | null
          profile_id?: string
          reason?: Database["public"]["Enums"]["infraction_reason"]
          status?: Database["public"]["Enums"]["infraction_status"]
        }
        Relationships: [
          {
            foreignKeyName: "infractions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "infractions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "infractions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          settings: Json | null
          slug: string
          theme: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          settings?: Json | null
          slug: string
          theme?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
          theme?: Json | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string | null
          id: string
          location_id: string
          profile_id: string
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_id: string
          profile_id: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location_id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthdate: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_location_id: string | null
          last_name: string | null
          phone: string | null
          preferences: Json | null
        }
        Insert: {
          avatar_url?: string | null
          birthdate?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          gender?: string | null
          id: string
          last_location_id?: string | null
          last_name?: string | null
          phone?: string | null
          preferences?: Json | null
        }
        Update: {
          avatar_url?: string | null
          birthdate?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_location_id?: string | null
          last_name?: string | null
          phone?: string | null
          preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_last_location_id_fkey"
            columns: ["last_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      program_workouts: {
        Row: {
          id: string
          program_id: string
          sort_order: number
          workout_id: string
        }
        Insert: {
          id?: string
          program_id: string
          sort_order?: number
          workout_id: string
        }
        Update: {
          id?: string
          program_id?: string
          sort_order?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programme_workouts_programme_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programme_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          class_type: string
          created_at: string | null
          id: string
          program_date: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          class_type: string
          created_at?: string | null
          id?: string
          program_date?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          class_type?: string
          created_at?: string | null
          id?: string
          program_date?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      results: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          notes: string | null
          profile_id: string
          score: string
          workout_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          profile_id: string
          score: string
          workout_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          profile_id?: string
          score?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "results_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_user_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          class_type: string | null
          clean_description: string | null
          coach_notes: string | null
          created_at: string | null
          created_by: string | null
          description: string
          duration: number | null
          id: string
          location_id: string | null
          slug: string
          structured_data: Json | null
          tags: string[] | null
          title: string | null
          workout_type: string | null
        }
        Insert: {
          class_type?: string | null
          clean_description?: string | null
          coach_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          duration?: number | null
          id?: string
          location_id?: string | null
          slug: string
          structured_data?: Json | null
          tags?: string[] | null
          title?: string | null
          workout_type?: string | null
        }
        Update: {
          class_type?: string | null
          clean_description?: string | null
          coach_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          duration?: number | null
          id?: string
          location_id?: string | null
          slug?: string
          structured_data?: Json | null
          tags?: string[] | null
          title?: string | null
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      distinct_types: {
        Row: {
          class_type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_program: { Args: { p_program_id: string }; Returns: undefined }
      get_unique_class_types: {
        Args: never
        Returns: {
          class_type: string
        }[]
      }
      invite_athlete: {
        Args: { loc_id: string; user_email: string }
        Returns: undefined
      }
      save_program: {
        Args: {
          p_blocks: Json
          p_class_type: string
          p_date: string
          p_program_id: string
          p_title: string
        }
        Returns: string
      }
    }
    Enums: {
      booking_status: "confirmed" | "waitlist" | "cancelled"
      infraction_reason: "late_cancel" | "no_show"
      infraction_status:
        | "pending_review"
        | "counted"
        | "waived"
        | "penalty_applied"
      user_role: "admin" | "manager" | "coach" | "athlete" | "guest"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: ["confirmed", "waitlist", "cancelled"],
      infraction_reason: ["late_cancel", "no_show"],
      infraction_status: [
        "pending_review",
        "counted",
        "waived",
        "penalty_applied",
      ],
      user_role: ["admin", "manager", "coach", "athlete", "guest"],
    },
  },
} as const
