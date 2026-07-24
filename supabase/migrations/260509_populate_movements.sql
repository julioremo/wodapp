INSERT INTO public.movements (name, slug, category, measurement_type) VALUES

  -- ==========================================
  -- 1. WEIGHT (measurement_type: 'weight')
  -- ==========================================
  ('Back Squat', 'back-squat', 'weight', 'weight'),
  ('Front Squat', 'front-squat', 'weight', 'weight'),
  ('Overhead Squat', 'overhead-squat', 'weight', 'weight'),
  ('Deadlift', 'deadlift', 'weight', 'weight'),
  ('Bench Press', 'bench-press', 'weight', 'weight'),
  ('Shoulder Press', 'shoulder-press', 'weight', 'weight'),
  ('Push Press', 'push-press', 'weight', 'weight'),
  ('Push Jerk', 'push-jerk', 'weight', 'weight'),
  ('Split Jerk', 'split-jerk', 'weight', 'weight'),
  ('Squat Clean', 'squat-clean', 'weight', 'weight'),
  ('Power Clean', 'power-clean', 'weight', 'weight'),
  ('Hang Squat Clean', 'hang-squat-clean', 'weight', 'weight'),
  ('Hang Power Clean', 'hang-power-clean', 'weight', 'weight'),
  ('Clean & Jerk', 'clean-and-jerk', 'weight', 'weight'),
  ('Squat Snatch', 'squat-snatch', 'weight', 'weight'),
  ('Power Snatch', 'power-snatch', 'weight', 'weight'),
  ('Hang Squat Snatch', 'hang-squat-snatch', 'weight', 'weight'),
  ('Hang Power Snatch', 'hang-power-snatch', 'weight', 'weight'),
  ('Muscle Snatch', 'muscle-snatch', 'weight', 'weight'),
  ('Snatch Balance', 'snatch-balance', 'weight', 'weight'),
  ('Thruster', 'thruster', 'weight', 'weight'),
  ('Cluster', 'cluster', 'weight', 'weight'),
  ('Hip Thrust', 'hip-thrust', 'weight', 'weight'),
  ('Pendlay Row', 'pendlay-row', 'weight', 'weight'),
  ('Turkish Get-Up', 'turkish-get-up', 'weight', 'weight'),
  ('Weighted Pull-Up', 'weighted-pull-up', 'weight', 'weight'),

  -- ==========================================
  -- 2. DISTANCE / ENDURANCE 
  -- (measurement_type: 'time' for fixed distances, 'distance' for max distance caps, 'calories' for max cals)
  -- ==========================================
  
  -- Runs
  ('100m Run', '100m-run', 'distance', 'time'),
  ('200m Run', '200m-run', 'distance', 'time'),
  ('400m Run', '400m-run', 'distance', 'time'),
  ('800m Run', '800m-run', 'distance', 'time'),
  ('1k Run', '1k-run', 'distance', 'time'),
  ('1500m Run', '1500m-run', 'distance', 'time'),
  ('1 Mile Run', '1-mile-run', 'distance', 'time'),
  ('5k Run', '5k-run', 'distance', 'time'),
  ('10k Run', '10k-run', 'distance', 'time'),
  ('Half Marathon', 'half-marathon-run', 'distance', 'time'),
  ('Marathon', 'marathon-run', 'distance', 'time'),
  ('12 Min Cooper Test (Max Distance)', 'cooper-test-run', 'distance', 'distance'),

  -- Swims (Olympic distances)
  ('50m Swim', '50m-swim', 'distance', 'time'),
  ('100m Swim', '100m-swim', 'distance', 'time'),
  ('200m Swim', '200m-swim', 'distance', 'time'),
  ('400m Swim', '400m-swim', 'distance', 'time'),
  ('800m Swim', '800m-swim', 'distance', 'time'),
  ('1500m Swim', '1500m-swim', 'distance', 'time'),

  -- Ergs (Row)
  ('500m Row', '500m-row', 'distance', 'time'),
  ('1k Row', '1k-row', 'distance', 'time'),
  ('2k Row', '2k-row', 'distance', 'time'),
  ('5k Row', '5k-row', 'distance', 'time'),
  ('10k Row', '10k-row', 'distance', 'time'),
  ('Half Marathon Row', 'half-marathon-row', 'distance', 'time'),

  -- Ergs (Ski)
  ('500m Ski', '500m-ski', 'distance', 'time'),
  ('1k Ski', '1k-ski', 'distance', 'time'),
  ('2k Ski', '2k-ski', 'distance', 'time'),
  ('5k Ski', '5k-ski', 'distance', 'time'),

  -- Ergs (BikeErg)
  ('4k BikeErg', '4k-bikeerg', 'distance', 'time'),
  ('10k BikeErg', '10k-bikeerg', 'distance', 'time'),

  -- Ergs (Assault/Echo Bike)
  ('50 Calorie Bike', '50-cal-bike', 'distance', 'time'),
  ('100 Calorie Bike', '100-cal-bike', 'distance', 'time'),
  ('10 Min Max Cals Bike', '10-min-max-cals-bike', 'distance', 'calories'),

  -- ==========================================
  -- 3. SKILLS 
  -- (measurement_type: 'reps', 'time', or 'distance')
  -- ==========================================
  
  -- Bar / Ring 
  ('Pull-Up', 'pull-up', 'skill', 'reps'),
  ('Banded Pull-Up', 'banded-pull-up', 'skill', 'reps'),
  ('Chest-to-Bar Pull-Up', 'chest-to-bar-pull-up', 'skill', 'reps'),
  ('Bar Muscle-Up', 'bar-muscle-up', 'skill', 'reps'),
  ('Ring Muscle-Up', 'ring-muscle-up', 'skill', 'reps'),
  ('Toes-to-Bar', 'toes-to-bar', 'skill', 'reps'),
  ('L-Sit Hold', 'l-sit-hold', 'skill', 'time'),

  -- Ground / Handstand
  ('Push-Up', 'push-up', 'skill', 'reps'),
  ('Handstand Push-Up (HSPU)', 'hspu', 'skill', 'reps'),
  ('Strict Handstand Push-Up', 'strict-hspu', 'skill', 'reps'),
  ('Handstand Hold', 'handstand-hold', 'skill', 'time'),
  ('Handstand Walk', 'handstand-walk', 'skill', 'distance'),
  
  -- Legs / Plyo
  ('Double-Under', 'double-under', 'skill', 'reps'),
  ('Unbroken Double-Unders', 'max-unbroken-double-unders', 'skill', 'reps'),
  ('Pistol Squat', 'pistol-squat', 'skill', 'reps'),
  ('Box Jump (Max Height)', 'max-box-jump', 'skill', 'distance')

ON CONFLICT (slug) DO NOTHING;