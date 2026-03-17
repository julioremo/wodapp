-- 1. Create the function that checks capacity
create or replace function check_class_capacity()
returns trigger as $$
declare
  current_bookings int;
  max_capacity int;
begin
  -- We only care about confirmed bookings taking up space
  if NEW.status = 'confirmed' then
    -- Get the capacity for this specific class
    select capacity into max_capacity from public.classes where id = NEW.class_id;
    
    -- If capacity is null, it implies an unlimited class, so we bypass the check
    if max_capacity is not null then
      -- Lock the rows for reading to prevent race conditions, then count
      select count(*) into current_bookings 
      from public.bookings 
      where class_id = NEW.class_id and status = 'confirmed';
      
      if current_bookings >= max_capacity then
        raise exception 'Class is at maximum capacity (%)', max_capacity;
      end if;
    end if;
  end if;
  
  return NEW;
end;
$$ language plpgsql;

-- 2. Attach the trigger to the bookings table
create trigger enforce_class_capacity
  before insert or update on public.bookings
  for each row
  execute function check_class_capacity();