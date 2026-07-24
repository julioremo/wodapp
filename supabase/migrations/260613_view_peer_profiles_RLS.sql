create or replace function get_my_location_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select location_id 
  from memberships 
  where profile_id = auth.uid() 
  and status = 'active';
$$;

drop policy if exists "Users can view memberships in their locations" on memberships;

create policy "Users can view location peers memberships" 
on memberships for select
to authenticated 
using (
  profile_id = auth.uid() 
  or 
  location_id in (select get_my_location_ids())
);

create policy "Authenticated users can view all profiles" 
on profiles for select 
to authenticated 
using (true);

create policy "Users can view location peers benchmarks" 
on benchmarks for select 
to authenticated 
using (
  profile_id = auth.uid()
  or
  profile_id in (
    select profile_id 
    from memberships 
    where location_id in (select get_my_location_ids())
  )
);