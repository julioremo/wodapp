// packages/types/src/index.ts
import type { Database } from './database.types';

export type { Database };

// Mapping the DB rows to clean names
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];
export type Membership = Database['public']['Tables']['memberships']['Row'];
export type Workout = Database['public']['Tables']['workouts']['Row'];
export type ClassSession = Database['public']['Tables']['classes']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type Result = Database['public']['Tables']['results']['Row'];

export type UserRole = 'admin' | 'manager' | 'coach' | 'athlete' | 'guest';
export type BookingStatus = 'confirmed' | 'waitlist' | 'cancelled';