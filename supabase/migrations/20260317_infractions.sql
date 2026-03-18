create type infraction_reason as enum ('late_cancel', 'no_show');
create type infraction_status as enum ('pending_review', 'counted', 'waived', 'penalty_applied');

create table infractions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  reason infraction_reason not null,
  status infraction_status not null default 'pending_review',
  notes text,
  created_at timestamptz not null default now()
);

-- Index for querying an athlete's active strikes at a specific gym
create index idx_infractions_profile_location on infractions(profile_id, location_id);
-- Index for the manager's review queue
create index idx_infractions_status on infractions(status);