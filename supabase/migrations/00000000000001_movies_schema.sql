-- 1. Create custom types (if not exists, but we can reuse show_status or make a new one)
CREATE TYPE public.movie_status AS ENUM ('watchlist', 'completed');

-- 2. Create user_movies table
CREATE TABLE public.user_movies (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  movie_id integer NOT NULL, -- TMDB Movie ID
  status public.movie_status NOT NULL DEFAULT 'watchlist',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (user_id, movie_id)
);

-- 3. Set up Row Level Security (RLS)
ALTER TABLE public.user_movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own movies."
  ON public.user_movies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own movies."
  ON public.user_movies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own movies."
  ON public.user_movies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movies."
  ON public.user_movies FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at columns
CREATE TRIGGER set_user_movies_updated_at
  BEFORE UPDATE ON public.user_movies
  FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
