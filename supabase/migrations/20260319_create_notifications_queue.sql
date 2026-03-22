create table notification_events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('waitlist_promoted', 'spot_broadcasted')),
  location_id uuid not null references locations(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade, -- Nullable for broadcasts
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  processed_at timestamptz
);