create or replace function sync_confirmed_bookings_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' and new.status::text = 'confirmed' then
    update classes 
    set confirmed_bookings_count = confirmed_bookings_count + 1 
    where id = new.class_id;
    
  elsif tg_op = 'DELETE' and old.status::text = 'confirmed' then
    update classes 
    set confirmed_bookings_count = confirmed_bookings_count - 1 
    where id = old.class_id;
    
  elsif tg_op = 'UPDATE' then
    -- Handle Waitlist to Confirmed
    if old.status::text = 'waitlist' and new.status::text = 'confirmed' then
      update classes 
      set confirmed_bookings_count = confirmed_bookings_count + 1 
      where id = new.class_id;
      
    -- Handle Confirmed to Waitlist OR Confirmed to Cancelled
    elsif old.status::text = 'confirmed' and (new.status::text = 'waitlist' or new.status::text = 'cancelled') then
      update classes 
      set confirmed_bookings_count = confirmed_bookings_count - 1 
      where id = new.class_id;
    end if;
  end if;
  
  return null;
end;
$$ language plpgsql security definer;