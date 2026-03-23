create or replace function cancel_class(
  p_profile_id uuid,
  p_class_id uuid
) returns jsonb as $$
declare
  v_booking record;
  v_next_waitlisted uuid;
begin
  -- 1. Find and lock the user's active booking
  select id, status into v_booking
  from bookings
  where profile_id = p_profile_id 
    and class_id = p_class_id 
    and status in ('confirmed', 'waitlist')
  for update;

  if not found then
    return jsonb_build_object('success', false, 'message', 'No active booking found');
  end if;

  -- 2. Update the user's booking to cancelled
  -- (This fires the trigger to decrement confirmed_bookings_count if they were confirmed)
  update bookings
  set status = 'cancelled'
  where id = v_booking.id;

  -- 3. If they gave up a confirmed spot, try to pull up the first waitlisted person
  if v_booking.status = 'confirmed' then
    select profile_id into v_next_waitlisted
    from bookings
    where class_id = p_class_id and status = 'waitlist'
    order by created_at asc
    limit 1
    for update;

    if found then
      -- Promote the waitlisted user
      -- (This fires the trigger to increment confirmed_bookings_count back up)
      update bookings
      set status = 'confirmed'
      where profile_id = v_next_waitlisted and class_id = p_class_id;
    end if;
  end if;

  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;