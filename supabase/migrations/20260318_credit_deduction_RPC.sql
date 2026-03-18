alter table memberships add column booking_lockout_until timestamptz;

create or replace function deduct_membership_credit(p_profile_id uuid, p_location_id uuid, p_amount int)
returns void as $$
begin
  update memberships
  set available_credits = available_credits - p_amount
  where profile_id = p_profile_id 
    and location_id = p_location_id 
    and available_credits >= p_amount;
end;
$$ language plpgsql;