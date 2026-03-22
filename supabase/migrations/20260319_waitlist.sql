-- 1. Update the custom enum type (if not already present)
alter type public.booking_status add value if not exists 'waitlist';
alter type public.booking_status add value if not exists 'cancelled';

-- 2. Add the tracking column
alter table public.bookings 
  add column promoted_at timestamp with time zone;

-- 3. Replace the strict unique constraint with a partial index
alter table public.bookings 
  drop constraint if exists bookings_class_id_user_id_key;

create unique index idx_one_active_booking_per_athlete 
on public.bookings (class_id, profile_id) 
where status in ('confirmed', 'waitlist');

-- 4. Optimize the trigger to only fire for confirmed bookings
drop trigger if exists enforce_class_capacity on public.bookings;

create trigger enforce_class_capacity 
before insert or update on public.bookings 
for each row 
when (NEW.status = 'confirmed')
execute function check_class_capacity();

-- 5. Create the Promotion RPC
create or replace function cancel_booking_and_promote(p_booking_id uuid)
returns void as $$
declare
  v_booking record;
  v_class record;
  v_settings jsonb;
  v_waitlist_policy jsonb;
  v_next_athlete uuid;
  v_cutoff_hours int;
  v_cutoff_time timestamptz;
begin
  -- Lock the row and get booking details
  select * into v_booking from public.bookings where id = p_booking_id for update;
  
  if not found or v_booking.status = 'cancelled' then
    return;
  end if;

  -- Cancel the current booking
  update public.bookings set status = 'cancelled' where id = p_booking_id;

  -- Fetch class and location settings (since location_id is on classes, not bookings)
  select * into v_class from public.classes where id = v_booking.class_id;
  select settings into v_settings from public.locations where id = v_class.location_id;
  
  v_waitlist_policy := v_settings->'policies'->'waitlist';

  -- Exit if waitlist is not active
  if coalesce((v_waitlist_policy->>'active')::boolean, false) = false then
    return;
  end if;

  -- Check mode: auto_enroll vs broadcast
  if v_waitlist_policy->>'mode' = 'auto_enroll' then
    
    v_cutoff_hours := (v_waitlist_policy->>'auto_enroll_cutoff_hours')::int;

    if v_cutoff_hours is not null then
      v_cutoff_time := v_class.start_time - (v_cutoff_hours || ' hours')::interval;
    end if;

    -- If we are past the cutoff, fallback to broadcast behavior
    if v_cutoff_time is not null and now() > v_cutoff_time then
      insert into notification_events (type, location_id, class_id)
      values ('spot_broadcasted', v_class.location_id, v_booking.class_id);
      return;
    end if;

    -- Find the oldest waitlisted athlete for this class
    select id into v_next_athlete 
    from public.bookings 
    where class_id = v_booking.class_id and status = 'waitlist'
    order by created_at asc
    limit 1
    for update skip locked;

    -- Promote them and queue a direct notification
    if v_next_athlete is not null then
      update public.bookings 
      set status = 'confirmed', promoted_at = now() 
      where id = v_next_athlete;

      insert into notification_events (type, location_id, class_id, profile_id)
      values ('waitlist_promoted', v_class.location_id, v_booking.class_id, (select profile_id from public.bookings where id = v_next_athlete));
    end if;

  elsif v_waitlist_policy->>'mode' = 'broadcast' then
    -- Just queue a broadcast event, no automatic promotion
    insert into notification_events (type, location_id, class_id)
    values ('spot_broadcasted', v_class.location_id, v_booking.class_id);
  end if;

end;
$$ language plpgsql;