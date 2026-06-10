-- bookings
CREATE POLICY "Users can view their own bookings" 
ON bookings FOR SELECT TO authenticated 
USING (profile_id = auth.uid());

CREATE POLICY "Users can manage their own bookings" 
ON bookings FOR ALL TO authenticated 
USING (profile_id = auth.uid()) 
WITH CHECK (profile_id = auth.uid());


-- infractions
CREATE POLICY "Users can view their own infractions" 
ON infractions FOR SELECT TO authenticated 
USING (profile_id = auth.uid());

CREATE POLICY "Staff can manage infractions" 
ON infractions FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM memberships 
    WHERE memberships.profile_id = auth.uid() 
    AND memberships.role = ANY (ARRAY['admin'::user_role, 'manager'::user_role])
    AND memberships.status = 'active'
  )
);


-- notification_events
CREATE POLICY "Users can view their own notifications" 
ON notification_events FOR SELECT TO authenticated 
USING (profile_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON notification_events FOR UPDATE TO authenticated 
USING (profile_id = auth.uid()) 
WITH CHECK (profile_id = auth.uid());


-- results
CREATE POLICY "Users can view all results" 
ON results FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Users can manage their own results" 
ON results FOR ALL TO authenticated 
USING (profile_id = auth.uid()) 
WITH CHECK (profile_id = auth.uid());


-- classes
ALTER POLICY "Staff can manage classes" ON public.classes TO authenticated;
ALTER POLICY "Anyone can view classes for their location" ON public.classes TO authenticated;