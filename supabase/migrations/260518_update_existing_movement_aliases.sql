-- Add the new column
ALTER TABLE public.movements 
ADD COLUMN aliases TEXT[] DEFAULT '{}'::text[];

-- Update existing movements
UPDATE public.movements AS m
SET aliases = v.aliases
FROM (VALUES
  ('front-squat', ARRAY['front squats', 'front squat']),
  ('overhead-squat', ARRAY['overhead squats', 'overhead squat', 'oh squats', 'oh squat']),
  ('push-press', ARRAY['push-presses', 'push-press', 'push presses', 'push press']),
  ('push-jerk', ARRAY['push-jerks', 'push-jerk', 'push jerks', 'push jerk']),
  ('split-jerk', ARRAY['split-jerks', 'split-jerk', 'split jerks', 'split jerk']),
  ('squat-clean', ARRAY['squat cleans', 'squat clean', 'clean', 'cleans']),
  ('power-clean', ARRAY['power cleans', 'power clean']),
  ('hang-squat-clean', ARRAY['hang squat cleans', 'hang squat clean', 'hang cleans', 'hang clean']),
  ('hang-power-clean', ARRAY['hang power cleans', 'hang power clean']),
  ('clean-and-jerk', ARRAY['clean-and-jerks', 'clean and jerks', 'c&j', 'c&js', 'c&j''s', 'c & j', 'c & j''s']),
  ('squat-snatch', ARRAY['squat snatches', 'squat snatch', 'snatch', 'snatches']),
  ('power-snatch', ARRAY['power snatches', 'power snatch']),
  ('hang-squat-snatch', ARRAY['hang squat snatches', 'hang squat snatch', 'hang snatches', 'hang snatch']),
  ('hang-power-snatch', ARRAY['hang power snatches', 'hang power snatch']),
  ('thruster', ARRAY['thrusters', 'thruster']),
  ('pull-up', ARRAY['pull ups', 'pull up', 'pullups', 'pullup', 'pull-ups', 'pull-up']),
  ('chest-to-bar-pull-up', ARRAY['c2bs', 'c2b', 'chest-to-bars', 'chest-to-bar', 'chest to bars', 'chest to bar', 'chest-to-bar pull-ups', 'chest-to-bar pull-up', 'chest to bar pull ups', 'chest to bar pull up']),
  ('bar-muscle-up', ARRAY['bar muscle-ups', 'bar muscle-up', 'muscle-ups', 'muscle-up', 'bmu', 'b.m.u.', 'b.m.u']),
  ('ring-muscle-up', ARRAY['ring muscle-ups', 'ring muscle-up', 'ring muscle ups', 'ring muscle up', 'rmu', 'r.m.u.', 'r.m.u']),
  ('toes-to-bar', ARRAY['toes to bar', 'toes to bars', 'toes-to-bars', 'toes-to-bar', 't2b', 't2bs', 't2bar']),
  ('l-sit-hold', ARRAY['l-sit holds', 'l-sit hold', 'l-sit']),
  ('push-up', ARRAY['push-ups', 'push-up']),
  ('hspu', ARRAY['handstand push-ups', 'handstand push-up', 'hspu']),
  ('handstand-hold', ARRAY['handstand holds', 'handstand hold', 'handstand', 'handstands', 'inversion']),
  ('handstand-walk', ARRAY['handstand walks', 'handstand walk']),
  ('double-under', ARRAY['double-unders', 'double unders', 'double-under', 'double under']),
  ('pistol-squat', ARRAY['pistol squats', 'pistol squat', 'single-leg squats', 'single-leg squat']),
  ('bench-press', ARRAY['bench-presses', 'bench-press', 'bench presses', 'bench press']),
  ('back-squat', ARRAY['back squats', 'back squat']),
  ('deadlift', ARRAY['deadlifts', 'deadlift']),
  ('shoulder-press', ARRAY['shoulder-presses', 'shoulder-press', 'shoulder presses', 'shoulder press', 'strict-presses', 'strict-press', 'strict presses', 'strict press', 'overhead-presses', 'overhead-press', 'overhead presses', 'overhead press', 'oh-presses', 'oh-press', 'oh presses', 'oh press'])
) AS v(slug, aliases)
WHERE m.slug = v.slug;