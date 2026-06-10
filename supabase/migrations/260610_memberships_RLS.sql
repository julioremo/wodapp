-- 1. Drop the old/dangerous policies
DROP POLICY IF EXISTS "Users can update own membership" ON public.memberships;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.memberships;

-- 2. Create the secure SELECT policy (Athletes can view their own data)
CREATE POLICY "Users can view own memberships"
ON public.memberships
FOR SELECT
TO authenticated
USING (auth.uid() = profile_id);

-- 3. Create the secure UPDATE policy (Only staff can change roles/statuses)
CREATE POLICY "Staff can update memberships for their location"
ON public.memberships
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships staff
    WHERE staff.profile_id = auth.uid()
    AND staff.location_id = memberships.location_id
    AND staff.role IN ('admin', 'manager')
    AND staff.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.memberships staff
    WHERE staff.profile_id = auth.uid()
    AND staff.location_id = memberships.location_id
    AND staff.role IN ('admin', 'manager')
    AND staff.status = 'active'
  )
);