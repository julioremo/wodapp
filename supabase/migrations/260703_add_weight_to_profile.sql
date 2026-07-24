-- Ensure the column exists first
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS weight numeric NULL;

-- Populate with synthetic data
UPDATE public.profiles
SET weight = ROUND(
  CAST(
    -- Base weight by gender
    CASE 
      WHEN lower(gender) IN ('male') THEN 75.0
      WHEN lower(gender) IN ('female') THEN 60.0
      ELSE 70.0
    END 
    
    -- Add 0.2kg for every year of age over 20 (defaults to +2.0kg if birthdate is null)
    + COALESCE((EXTRACT(YEAR FROM age(birthdate)) - 20) * 0.2, 2.0)
    
    -- Add a random variance between -5kg and +5kg
    + (random() * 10 - 5) 
  AS numeric), 
  1
)
WHERE weight IS NULL;