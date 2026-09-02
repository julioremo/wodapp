update public.profiles
set preferences = coalesce(preferences, '{}'::jsonb) || 
  jsonb_build_object(
    'privacy', jsonb_build_object(
      'show_on_leaderboard', random() < 0.8,
      'allow_data_usage_for_research', false
    )
  )
where id != '30eec07d-510c-466d-a8cc-549ad97489b1';