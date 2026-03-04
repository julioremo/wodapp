-- Add the column
ALTER TABLE public.workouts 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE;

-- Backfill the existing null rows with dev location
UPDATE public.workouts 
SET location_id = '0000' -- Enter actual dev location id
WHERE location_id IS NULL;

-- View policy: Staff can view workouts for their location
CREATE POLICY "Staff can view location workouts"
ON public.workouts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships
    WHERE memberships.location_id = workouts.location_id
      AND memberships.profile_id = auth.uid()
      AND memberships.status = 'active'
  )
);

-- Insert/Update/Delete policy: Staff can manage location workouts
CREATE POLICY "Staff can manage location workouts"
ON public.workouts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships
    WHERE memberships.location_id = workouts.location_id
      AND memberships.profile_id = auth.uid()
      AND memberships.role IN ('admin', 'manager', 'coach')
      AND memberships.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.memberships
    WHERE memberships.location_id = workouts.location_id
      AND memberships.profile_id = auth.uid()
      AND memberships.role IN ('admin', 'manager', 'coach')
      AND memberships.status = 'active'
  )
);