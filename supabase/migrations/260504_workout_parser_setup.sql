-- ============================================================
-- 1. Migrations — add worker columns to existing workouts table
-- ============================================================

-- Processing status (the trigger fires only on 'pending' rows)
alter table public.workouts
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'processing', 'done', 'error'));

-- Human-readable error surfaced to the frontend on failure
alter table public.workouts
  add column if not exists error text;

-- Note: clean_description and structured_data already exist in your table.

-- Enable realtime so Svelte gets live updates
alter publication supabase_realtime add table public.workouts;

-- ============================================================
-- 2. pg_net webhook — fires on every INSERT into workouts
--    Requires the pg_net extension (enabled by default on Supabase)
-- ============================================================
create extension if not exists pg_net;

create or replace function notify_worker()
returns trigger language plpgsql as $$
begin
  perform net.http_post(
    url     := 'https://your-worker.example.com/webhook/workout',
    headers := jsonb_build_object(
                 'Content-Type',     'application/json',
                 'X-Webhook-Secret', current_setting('app.webhook_secret', true)
               ),
    body    := jsonb_build_object(
                 'type',       'INSERT',
                 'table',      'workouts',
                 'schema',     'public',
                 'record',     row_to_json(NEW),
                 'old_record', null
               )
  );
  return NEW;
end;
$$;

create trigger workouts_insert_webhook
  after insert on public.workouts
  for each row execute function notify_worker();

-- Store the secret as a Postgres setting (via Supabase dashboard or migration)
-- alter database postgres set app.webhook_secret = 'your-secret-here';

-- ============================================================
-- 3. Index on status for efficient filtering
-- ============================================================
create index if not exists workouts_status_idx on public.workouts (status);