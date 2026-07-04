-- 1. Create custom types
CREATE TYPE public.show_status AS ENUM ('watching', 'watchlist', 'on_hold', 'dropped', 'completed');

-- 2. Create tables
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users on delete cascade,
  email text NOT NULL,
  display_name text,
  avatar_url text,
  is_admin boolean DEFAULT false,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE public.user_shows (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  show_id integer NOT NULL, -- TMDB Show ID
  status public.show_status NOT NULL DEFAULT 'watching',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (user_id, show_id)
);

CREATE TABLE public.user_episodes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  show_id integer NOT NULL,
  season_number integer NOT NULL,
  episode_number integer NOT NULL,
  watched_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (user_id, show_id, season_number, episode_number)
);

CREATE TABLE public.app_config (
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (key)
);

-- 3. Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (is_public = true OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- User Shows Policies
CREATE POLICY "Users can view their own shows."
  ON public.user_shows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shows."
  ON public.user_shows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shows."
  ON public.user_shows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shows."
  ON public.user_shows FOR DELETE
  USING (auth.uid() = user_id);

-- User Episodes Policies
CREATE POLICY "Users can view their own episodes."
  ON public.user_episodes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own episodes."
  ON public.user_episodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own episodes."
  ON public.user_episodes FOR DELETE
  USING (auth.uid() = user_id);

-- App Config Policies
CREATE POLICY "App config is viewable by everyone."
  ON public.app_config FOR SELECT
  USING (true);

-- Functions and Triggers
-- Function to automatically create a profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- Trigger to call handle_new_user when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to update updated_at columns
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

CREATE TRIGGER set_user_shows_updated_at
  BEFORE UPDATE ON public.user_shows
  FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

CREATE TRIGGER set_app_config_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
