create or replace function book_class(
  p_profile_id uuid,
  p_class_id uuid
) returns jsonb as $$
declare
  v_class record;
  v_status public.booking_status;
begin
  select capacity, confirmed_bookings_count into v_class
  from classes
  where id = p_class_id
  for update;

  if not found then
    raise exception 'Class not found';
  end if;

  if v_class.confirmed_bookings_count >= v_class.capacity then
    v_status := 'waitlist';
  else
    v_status := 'confirmed';
  end if;

  insert into bookings (profile_id, class_id, status)
  values (p_profile_id, p_class_id, v_status);

  return jsonb_build_object(
    'success', true,
    'status', v_status
  );
end;
$$ language plpgsql security definer;