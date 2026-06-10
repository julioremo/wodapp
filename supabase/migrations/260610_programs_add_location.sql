-- 1. Schema Updates
ALTER TABLE public.programs 
ADD COLUMN location_id UUID;

ALTER TABLE public.programs
ADD CONSTRAINT fk_programs_location
FOREIGN KEY (location_id) 
REFERENCES public.locations(id)
ON DELETE CASCADE;

-- (Here we can backfill existing rows with a certain id)
-- UPDATE public.programs SET location_id = 'YOUR-UUID' WHERE location_id IS NULL;