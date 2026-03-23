do $$
declare
  new_id uuid;
  i int;
  first_names text[] := array['Alejandro', 'Carmen', 'David', 'Elena', 'Francisco', 'Laura', 'Manuel', 'María', 'Pablo', 'Sofía', 'Javier', 'Isabel', 'Carlos', 'Lucía', 'Antonio', 'Ana'];
  last_names text[] := array['García', 'Martínez', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero'];
  nicknames text[] := array['Paquillo', 'Chema', 'Lola', 'Paco', 'Pepe', 'Nacho', 'Charo', 'Txema', 'Sofi', 'Lolo'];
  fname text;
  lname text;
  dname text;
  dummy_email text;
  target_location_id uuid;
begin
  -- Grab a valid location_id (gets the first one it finds)
  -- To hardcode it, use: target_location_id := 'your-uuid-here';
  select id into target_location_id from public.locations limit 1;

  if target_location_id is null then
    raise exception 'No locations found. Please ensure you have a location created.';
  end if;

  for i in 1..25 loop
    new_id := gen_random_uuid();
    
    -- Pick random names
    fname := first_names[floor(random() * array_length(first_names, 1) + 1)];
    lname := last_names[floor(random() * array_length(last_names, 1) + 1)] || ' ' || last_names[floor(random() * array_length(last_names, 1) + 1)];
    
    -- 30% chance to assign a nickname
    if random() < 0.3 then
      dname := nicknames[floor(random() * array_length(nicknames, 1) + 1)];
    else
      dname := fname;
    end if;

    -- Generate a fake local email
    dummy_email := lower(fname || '.' || replace(lname, ' ', '') || i::text || '@dummybox.local');

    -- 1. Insert into auth.users
    insert into auth.users (id, aud, role, email, email_confirmed_at)
    values (new_id, 'authenticated', 'authenticated', dummy_email, now());

    -- 2. Insert into public.profiles
    insert into public.profiles (id, first_name, last_name, display_name, email, last_location_id)
    values (new_id, fname, lname, dname, dummy_email, target_location_id)
    on conflict (id) do update 
    set first_name = excluded.first_name,
        last_name = excluded.last_name,
        display_name = excluded.display_name,
        email = excluded.email,
        last_location_id = excluded.last_location_id;

    -- 3. Insert into public.memberships
    insert into public.memberships (profile_id, location_id, role, status)
    values (new_id, target_location_id, 'athlete', 'active')
    on conflict (profile_id, location_id) do nothing;
        
  end loop;
end $$;