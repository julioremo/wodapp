DO $$
DECLARE
  i int;
  new_user_id uuid;
  first_names text[] := ARRAY['Laura', 'Marco', 'Marta', 'Elena', 'Johan', 'Julia', 'Carlo', 'Diego', 'Anna', 'Flora', 'Noel', 'Guillermo', 'Mariona', 'Martina', 'Micaela', 'Patricia', 'Alba', 'Rosa', 'Vicente', 'Carmen', 'Aitana', 'Naiara', 'Amaia', 'Igor', 'Andrés', 'Eladio', 'Indalecio', 'Juan', 'José Luis', 'Luis', 'Pilar'];
  last_names text[] := ARRAY['Müller', 'García', 'Jansen', 'Rodríguez', 'López', 'de Jong', 'Smith', 'Martínez', 'Ferrán', 'Jáuregui', 'Jaén', 'Sevilla', 'Carpintero', 'Ortega', 'Céspedes', 'Borrego', 'Arregui', 'Liébana', 'Peñas', 'Dueñas', 'Catalá', 'Nebreda', 'Huesa', 'de la Hoz', 'Heras', 'Gutiérrez', 'Ferrer', 'Hoyas', 'Ruiz', 'Pinto', 'Hernán', 'Molina', 'Fuentes', 'Sastre', 'Vallés', 'Yagüe', 'Galiano', 'Zamora', 'Huertas', 'Vinuesa', 'Sil', 'Sorbas', 'Ballesteros'];
  genders text[] := ARRAY['male', 'female'];
  selected_first text;
  selected_last text;
  generated_email text;
  target_location_id uuid;

BEGIN
  select id into target_location_id from public.locations limit 1;

  if target_location_id is null then
    raise exception 'No locations found. Please ensure you have a location created.';
  end if;

  FOR i IN 10..99 LOOP
    -- Generate a single UUID to link auth.users and public.profiles
    new_user_id := gen_random_uuid();
    -- Pick random names
    selected_first := first_names[floor(random() * array_length(first_names, 1) + 1)];
    selected_last := last_names[floor(random() * array_length(last_names, 1) + 1)];
    generated_email := lower(selected_first) || '.' || lower(selected_last) || i || '@dummybox.local';

    -- 1. Insert minimal required fields into auth.users
    INSERT INTO auth.users (
      id, 
      aud, 
      role, 
      email,
      email_confirmed_at
    )
    VALUES (
      new_user_id, 
      'authenticated', 
      'authenticated', 
      generated_email, 
      now()
    );
    

    -- 2. Insert the randomized profile data
    INSERT INTO public.profiles (
      id, 
      display_name, 
      email, 
      first_name, 
      last_name, 
      gender, 
      birthdate,
      last_location_id
    ) VALUES (
      new_user_id,
      selected_first,
      generated_email,
      selected_first,
      selected_last,
      genders[floor(random() * array_length(genders, 1) + 1)],
      (NOW() - (random() * (interval '66 years') + interval '16 years'))::date,
      target_location_id
    )
    ON CONFLICT (id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      email = EXCLUDED.email,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      gender = EXCLUDED.gender,
      birthdate = EXCLUDED.birthdate,
      last_location_id = EXCLUDED.last_location_id;

    
    INSERT INTO public.memberships (
        profile_id, 
        location_id, 
        role, 
        status
    ) VALUES (
        new_user_id, 
        'ec89dc8f-7a96-4f26-9fcc-df661e2878d7'::uuid, 
        'athlete'::public.user_role, 
        'active'
    );

    -- 4. Insert the benchmark
    INSERT INTO public.benchmarks (
        profile_id, 
        movement_id, 
        score, 
        reps, 
        date
    ) VALUES (
        new_user_id,
        '272966a7-6a01-45bb-b0b7-df3836c95109'::uuid,
        round((random() * (160 - 35) + 35)::numeric, 1),
        1,
        CASE 
            WHEN random() > 0.5 THEN '2026-03-10'::date
            ELSE CURRENT_DATE - (random() * 365)::integer
        END
    );

  END LOOP;
END $$;