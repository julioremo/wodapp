CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());


ALTER POLICY "Users can view own profile" ON public.profiles TO authenticated;