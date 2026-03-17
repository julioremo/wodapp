UPDATE locations
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{policies}',
  '{
    "booking_opens": { 
      "type": "rolling_days", 
      "days": 7, 
      "hour": null, 
      "dayOfWeek": null 
    },
    "booking_closes": { 
      "active": true, 
      "minutes_prior": 60 
    },
    "cancellation": { 
      "active": false, 
      "window_hours": null, 
      "penalty": { "type": "credit_deduction", "strikes": 1 } 
    },
    "no_show": { 
      "active": false, 
      "penalty": { "type": "credit_deduction", "strikes": 1 } 
    },
    "waitlist": { 
      "active": true, 
      "max_size": null, 
      "mode": "broadcast", 
      "auto_enroll_cutoff_hours": null 
    }
  }'::jsonb
);