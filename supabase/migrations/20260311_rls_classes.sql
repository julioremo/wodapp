-- Enable RLS
alter table public.classes enable row level security;

-- Athletes can view classes for their location
create policy "Anyone can view classes for their location"
  on public.classes for select
  using (
    location_id in (
      select location_id from public.memberships 
      where profile_id = auth.uid() and status = 'active'
    )
  );

-- Only Managers and Admins can create or update classes
create policy "Staff can manage classes"
  on public.classes for all
  using (
    location_id in (
      select location_id from public.memberships 
      where profile_id = auth.uid() and role in ('admin', 'manager')
    )
  );