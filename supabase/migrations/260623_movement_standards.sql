create table public.movement_standards (
  id uuid default gen_random_uuid() primary key,
  -- Adjust the type of movement_id (uuid or bigint) to match your existing movements table
  movement_id uuid not null references public.movements(id) on delete cascade,
  gender text not null,
  min_age integer not null,
  max_age integer not null,
  min_bodyweight_kg numeric not null,
  max_bodyweight_kg numeric,
  level_untrained_kg numeric,
  level_novice_kg numeric,
  level_intermediate_kg numeric,
  level_advanced_kg numeric,
  level_elite_kg numeric,
  level_world_record_kg numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(movement_id, gender, min_age, min_bodyweight_kg)
);

alter table public.movement_standards enable row level security;

create policy "Anyone can view movement standards"
  on public.movement_standards 
  for select
  to public
  using (true);

-- Only admins can write
create policy "Admin can write movement standards"
on public.movement_standards
for all
to authenticated
using (
    EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE profile_id = auth.uid()
        AND role IN ('admin')
    )
);