-- 1. Programs RLS
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only view programs assigned to their location" ON public.programs;
DROP POLICY IF EXISTS "Authorized staff can insert programs for their location" ON public.programs;
DROP POLICY IF EXISTS "Authorized staff can update programs for their location" ON public.programs;
DROP POLICY IF EXISTS "Authorized staff can delete programs for their location" ON public.programs;

CREATE POLICY "Users can only view programs assigned to their location"
ON public.programs
FOR SELECT
TO authenticated
USING (
  location_id = (
    SELECT last_location_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Authorized staff can insert programs for their location"
ON public.programs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE profile_id = auth.uid()
    AND location_id = public.programs.location_id
    AND role IN ('admin', 'manager', 'coach')
    AND status = 'active'
  )
);

CREATE POLICY "Authorized staff can update programs for their location"
ON public.programs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE profile_id = auth.uid()
    AND location_id = public.programs.location_id
    AND role IN ('admin', 'manager', 'coach')
    AND status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE profile_id = auth.uid()
    AND location_id = public.programs.location_id
    AND role IN ('admin', 'manager', 'coach')
    AND status = 'active'
  )
);

CREATE POLICY "Authorized staff can delete programs for their location"
ON public.programs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE profile_id = auth.uid()
    AND location_id = public.programs.location_id
    AND role IN ('admin', 'manager', 'coach')
    AND status = 'active'
  )
);


-- 2. Workouts RLS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.workouts;
DROP POLICY IF EXISTS "Staff can insert workouts for their location" ON public.workouts;
DROP POLICY IF EXISTS "Staff can manage location workouts" ON public.workouts;

CREATE POLICY "Users can view local and global workouts"
ON public.workouts
FOR SELECT
TO authenticated
USING (
  workouts.location_id IS NULL
  OR
  EXISTS (
    SELECT 1 FROM public.memberships
    WHERE profile_id = auth.uid()
    AND location_id = workouts.location_id
    AND status = 'active'
  )
);

CREATE POLICY "Staff can insert workouts"
ON public.workouts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.memberships
    WHERE profile_id = auth.uid()
    AND location_id = workouts.location_id
    AND role IN ('admin', 'manager', 'coach')
    AND status = 'active'
  )
  OR
  (
    workouts.location_id IS NULL 
    AND EXISTS (
      SELECT 1 FROM public.memberships
      WHERE profile_id = auth.uid()
      AND role IN ('admin', 'manager', 'coach')
      AND status = 'active'
    )
  )
);

CREATE POLICY "Staff can update workouts"
ON public.workouts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships
    WHERE profile_id = auth.uid()
    AND location_id = workouts.location_id
    AND role IN ('admin', 'manager', 'coach')
    AND status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.memberships
    WHERE profile_id = auth.uid()
    AND location_id = workouts.location_id
    AND role IN ('admin', 'manager', 'coach')
    AND status = 'active'
  )
);

CREATE POLICY "Staff can delete workouts"
ON public.workouts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships
    WHERE profile_id = auth.uid()
    AND location_id = workouts.location_id
    AND role IN ('admin', 'manager', 'coach')
    AND status = 'active'
  )
);


-- 3. Program Workouts RLS
DROP POLICY IF EXISTS "Users can view program workouts" ON public.program_workouts;
DROP POLICY IF EXISTS "Staff can manage program workouts" ON public.program_workouts;

CREATE POLICY "Users can view program workouts" 
ON public.program_workouts 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Staff can manage program workouts" 
ON public.program_workouts 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE memberships.profile_id = auth.uid() 
    AND memberships.role IN ('admin', 'manager', 'coach')
    AND memberships.status = 'active'
  )
);