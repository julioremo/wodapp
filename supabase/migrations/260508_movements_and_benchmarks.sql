-- 1. Create the movements taxonomy table
CREATE TABLE public.movements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  category text NOT NULL,
  measurement_type text NOT NULL,
  description text NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT movements_pkey PRIMARY KEY (id),
  CONSTRAINT movements_slug_key UNIQUE (slug),
  CONSTRAINT check_category CHECK (category IN ('weight', 'distance', 'skill', 'accessory')),
  CONSTRAINT check_measurement CHECK (measurement_type IN ('weight', 'time', 'reps', 'distance', 'calories'))
) TABLESPACE pg_default;

-- 2. The Benchmarks Table
CREATE TABLE public.benchmarks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  profile_id uuid NOT NULL,
  movement_id uuid NOT NULL,
  score numeric NOT NULL,
  reps integer DEFAULT 1 NOT NULL, 
  estimated_1rm numeric GENERATED ALWAYS AS (
    score * (1.0 + (reps::numeric / 30.0))
  ) STORED,
  notes text NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT benchmarks_pkey PRIMARY KEY (id),
  CONSTRAINT benchmark_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT benchmark_movement_id_fkey FOREIGN KEY (movement_id) REFERENCES public.movements (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create an index to make the athlete's history page load instantly
CREATE INDEX idx_benchmarks_profile ON public.benchmarks(profile_id, movement_id);