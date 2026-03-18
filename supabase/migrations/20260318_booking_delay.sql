alter table memberships add column booking_delay_minutes numeric default 0;

create or replace function increment_booking_delay(p_profile_id uuid, p_location_id uuid, p_minutes numeric)
returns void as $$
begin
  update memberships
  set booking_delay_minutes = booking_delay_minutes + p_minutes
  where profile_id = p_profile_id 
    and location_id = p_location_id;
end;
$$ language plpgsql;