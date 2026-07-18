-- Add username column to profiles table
ALTER TABLE public.profiles ADD COLUMN username text UNIQUE;

-- Function to generate a random string
CREATE OR REPLACE FUNCTION public.generate_random_string(length integer)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer := 0;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Update the handle_new_user function to automatically assign a username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  base_username text;
  final_username text;
  counter integer := 1;
BEGIN
  -- Extract base username from email (before the @ sign) and keep only alphanumeric chars
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
  
  -- If base_username is empty, fallback to 'user'
  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  -- Initial attempt with a 4-digit random string attached
  final_username := base_username || public.generate_random_string(4);

  -- Loop to ensure uniqueness (very unlikely to loop more than once, but safe)
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || public.generate_random_string(4);
  END LOOP;

  INSERT INTO public.profiles (id, email, display_name, avatar_url, username)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    final_username
  );
  RETURN new;
END;
$$;

-- Backfill existing profiles that do not have a username
DO $$
DECLARE
  profile_rec record;
  base_username text;
  final_username text;
BEGIN
  FOR profile_rec IN SELECT id, email FROM public.profiles WHERE username IS NULL LOOP
    -- Extract base username from email (before the @ sign) and keep only alphanumeric chars
    base_username := lower(regexp_replace(split_part(profile_rec.email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
    
    IF base_username = '' THEN
      base_username := 'user';
    END IF;

    final_username := base_username || public.generate_random_string(4);

    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
      final_username := base_username || public.generate_random_string(4);
    END LOOP;

    UPDATE public.profiles SET username = final_username WHERE id = profile_rec.id;
  END LOOP;
END;
$$;
