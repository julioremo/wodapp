create or replace function check_class_capacity()
returns trigger as $$
declare
  current_bookings int;
  max_capacity int;
begin
  if NEW.status = 'confirmed' then
    -- 1. Lock the parent class row. This is the bottleneck that prevents race conditions.
    select capacity into max_capacity 
    from public.classes 
    where id = NEW.class_id
    for update; 
    
    if max_capacity is not null then
      -- 2. Now count the active bookings. Because the class is locked, this count is 100% accurate.
      select count(*) into current_bookings 
      from public.bookings 
      where class_id = NEW.class_id and status = 'confirmed';
      
      -- 3. In a BEFORE trigger, NEW hasn't been inserted yet, so if current == max, the class is full.
      if current_bookings >= max_capacity then
        raise exception 'Class is at maximum capacity (%)', max_capacity;
      end if;
    end if;
  end if;
  
  return NEW;
end;
$$ language plpgsql;