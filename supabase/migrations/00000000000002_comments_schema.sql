-- Create comments table
CREATE TABLE public.comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  media_type text NOT NULL, -- 'movie' or 'show'
  media_id integer NOT NULL, -- TMDB ID
  rating integer, -- 1 to 5
  content text,
  photo_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Set up RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone."
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own comments."
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments."
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments."
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at columns
CREATE TRIGGER set_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

-- Create storage bucket for comments
insert into storage.buckets (id, name, public)
values ('comments', 'comments', true)
on conflict (id) do nothing;

create policy "Comments images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'comments' );

create policy "Users can upload comment images."
  on storage.objects for insert
  with check ( bucket_id = 'comments' and auth.uid() = owner );
