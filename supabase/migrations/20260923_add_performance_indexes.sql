-- Migration: Add performance indexes for bookings and classes
-- Helps accelerate athlete attendance calendar and schedule lookups

-- 1. Index on bookings by profile and status (RLS evaluation and athlete attendance)
CREATE INDEX IF NOT EXISTS idx_bookings_profile_status 
ON public.bookings(profile_id, status);

-- 2. Index on classes by location and start_time (schedule and calendar range queries)
CREATE INDEX IF NOT EXISTS idx_classes_location_start_time 
ON public.classes(location_id, start_time);

-- 3. Index on classes by coach_id (foreign key join optimization)
CREATE INDEX IF NOT EXISTS idx_classes_coach_id 
ON public.classes(coach_id);
