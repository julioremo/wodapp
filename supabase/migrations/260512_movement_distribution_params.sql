-- 1. Add the JSONB column
ALTER TABLE public.movements 
ADD COLUMN distribution JSONB DEFAULT '{}'::jsonb;

-- 2. Inject the data for the Back Squat
UPDATE public.movements
SET distribution = '{
  "male": [
    {
      "type": "logNormal",
      "weight": 0.7,
      "mu": 4.4,
      "sigma": 0.3
    },
    {
      "type": "normal",
      "weight": 0.3,
      "mean": 142,
      "stdDev": 25
    }
  ],
  "female": [
    {
      "type": "logNormal",
      "weight": 0.7,
      "mu": 3.9,
      "sigma": 0.3
    },
    {
      "type": "normal",
      "weight": 0.3,
      "mean": 85,
      "stdDev": 18
    }
  ]
}'::jsonb
WHERE slug = 'back-squat';