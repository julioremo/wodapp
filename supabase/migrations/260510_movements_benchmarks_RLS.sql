-- ==========================================
-- 1. Enable RLS
-- ==========================================
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. Movements Table Policies (The Taxonomy)
-- ==========================================
-- Athletes need to be able to read the whole catalog to navigate the app.
-- Only admins/coaches should be able to insert/update (omitted here for safety).

CREATE POLICY "Movements are viewable by authenticated users"
ON public.movements
FOR SELECT
TO authenticated
USING (true);

-- ==========================================
-- 3. Benchmarks Table Policies (The User Data)
-- ==========================================
-- Athletes can only interact with rows where the profile_id matches their auth ID.

-- READ
CREATE POLICY "Users can view their own benchmarks"
ON public.benchmarks
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

-- CREATE
CREATE POLICY "Users can insert their own benchmarks"
ON public.benchmarks
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- UPDATE
CREATE POLICY "Users can update their own benchmarks"
ON public.benchmarks
FOR UPDATE
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- DELETE
CREATE POLICY "Users can delete their own benchmarks"
ON public.benchmarks
FOR DELETE
TO authenticated
USING (profile_id = auth.uid());