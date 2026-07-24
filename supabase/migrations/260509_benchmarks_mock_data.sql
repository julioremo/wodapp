DO $$
DECLARE
  julio_id uuid := 'c90f9fd3-f3b8-447a-aced-b7de7f3f1510';
BEGIN
  INSERT INTO public.benchmarks (profile_id, movement_id, score, reps, date, notes) VALUES

    -- ==========================================
    -- WEIGHTLIFTING (Progressive Overload)
    -- ==========================================
    
    -- Back Squat progression (from a 5RM to a heavy 1RM)
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'back-squat'), 95.0, 5, (CURRENT_DATE - INTERVAL '120 days')::date, '5RM testing. Tough on the last rep.'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'back-squat'), 105.0, 3, (CURRENT_DATE - INTERVAL '60 days')::date, 'Felt solid.'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'back-squat'), 115.0, 1, (CURRENT_DATE - INTERVAL '10 days')::date, 'New 1RM! Depth was good.'),

    -- Deadlift progression
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'deadlift'), 130.0, 3, (CURRENT_DATE - INTERVAL '90 days')::date, 'Mixed grip.'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'deadlift'), 145.0, 1, (CURRENT_DATE - INTERVAL '30 days')::date, 'Went up smooth.'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'deadlift'), 155.0, 1, (CURRENT_DATE - INTERVAL '2 days')::date, 'Absolute grinder but locked it out.'),

    -- Front Squat
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'front-squat'), 85.0, 3, (CURRENT_DATE - INTERVAL '45 days')::date, 'Wrist mobility getting better.'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'front-squat'), 95.0, 1, (CURRENT_DATE - INTERVAL '5 days')::date, 'PR!'),

    -- Olympic Lifts (Squat Clean & Snatch)
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'squat-clean'), 75.0, 1, (CURRENT_DATE - INTERVAL '80 days')::date, 'Caught it a bit high.'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'squat-clean'), 82.5, 1, (CURRENT_DATE - INTERVAL '15 days')::date, 'Felt fast under the bar.'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'squat-snatch'), 55.0, 1, (CURRENT_DATE - INTERVAL '60 days')::date, 'Still working on the catch.'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'squat-snatch'), 62.5, 1, (CURRENT_DATE - INTERVAL '12 days')::date, 'Finally stabilized the shoulders!'),

    -- Presses
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'shoulder-press'), 57.0, 1, (CURRENT_DATE - INTERVAL '40 days')::date, 'Strict.'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'push-press'), 65.0, 1, (CURRENT_DATE - INTERVAL '25 days')::date, 'Dip and drive!'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'bench-press'), 70.0, 5, (CURRENT_DATE - INTERVAL '100 days')::date, 'Standard 5x5 day.'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'bench-press'), 72.5, 1, (CURRENT_DATE - INTERVAL '14 days')::date, 'Spotter barely touched it.'),

    -- Other Lifts
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'overhead-squat'), 60.0, 3, (CURRENT_DATE - INTERVAL '20 days')::date, NULL),
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'thruster'), 60.0, 1, (CURRENT_DATE - INTERVAL '50 days')::date, 'Gross.'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'weighted-pull-up'), 15.0, 3, (CURRENT_DATE - INTERVAL '35 days')::date, '15kg dumbbell between feet.'),

    -- ==========================================
    -- DISTANCE (Scores are in seconds)
    -- ==========================================
    
    -- 100m Sprint
    (julio_id, (SELECT id FROM public.movements WHERE slug = '100m-run'), 14.5, 1, (CURRENT_DATE - INTERVAL '50 days')::date, 'Track day.'),

    -- 1k Run Progression (Improving from 4:20 to 3:55 to 3:40)
    (julio_id, (SELECT id FROM public.movements WHERE slug = '1k-run'), 260.0, 1, (CURRENT_DATE - INTERVAL '150 days')::date, 'Paced it poorly, went out too hot.'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = '1k-run'), 235.0, 1, (CURRENT_DATE - INTERVAL '80 days')::date, 'Much better breathing rhythm.'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = '1k-run'), 220.0, 1, (CURRENT_DATE - INTERVAL '5 days')::date, 'Sub-4 minute pace held! Felt like flying.'),

    -- 5k Run
    (julio_id, (SELECT id FROM public.movements WHERE slug = '5k-run'), 1355.0, 1, (CURRENT_DATE - INTERVAL '20 days')::date, '22:35 finish. Zone 4 most of the way.'),

    -- ==========================================
    -- SKILLS (Scores are standard reps/seconds)
    -- ==========================================
    
    -- Pull-ups
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'pull-up'), 8.0, 8, (CURRENT_DATE - INTERVAL '180 days')::date, 'Max unbroken strict.'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'pull-up'), 14.0, 14, (CURRENT_DATE - INTERVAL '40 days')::date, 'Kipping felt great today.'),

    -- Double Unders
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'double-under'), 22.0, 22, (CURRENT_DATE - INTERVAL '100 days')::date, 'Tripped up.'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'max-unbroken-double-unders'), 56.0, 56, (CURRENT_DATE - INTERVAL '10 days')::date, 'Finally passed 50!'),

    -- Muscle Ups
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'ring-muscle-up'), 1.0, 1, (CURRENT_DATE - INTERVAL '90 days')::date, 'FIRST RING MUSCLE UP!!!'),
    (julio_id, (SELECT id FROM public.movements WHERE slug = 'ring-muscle-up'), 3.0, 3, (CURRENT_DATE - INTERVAL '15 days')::date, 'Strung 3 together.');

END $$;