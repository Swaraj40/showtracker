-- Update comments table
ALTER TABLE public.comments ADD COLUMN parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

-- Create comment_likes table
CREATE TABLE public.comment_likes (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, comment_id)
);

-- Enable RLS on comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Comment Likes Policies
CREATE POLICY "Comment likes are viewable by everyone."
  ON public.comment_likes FOR SELECT USING (true);

CREATE POLICY "Users can like comments."
  ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments."
  ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Update notifications table
ALTER TABLE public.notifications ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;

-- Trigger for sending a notification when a comment is liked
CREATE OR REPLACE FUNCTION public.handle_new_comment_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  comment_author_id uuid;
BEGIN
  -- Get the author of the comment
  SELECT user_id INTO comment_author_id FROM public.comments WHERE id = new.comment_id;
  
  -- Don't notify if liking own comment
  IF comment_author_id != new.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, metadata)
    VALUES (comment_author_id, new.user_id, 'like', jsonb_build_object('comment_id', new.comment_id));
  END IF;
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_comment_like_created
  AFTER INSERT ON public.comment_likes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_comment_like();

-- Trigger for sending a notification when a comment receives a reply
CREATE OR REPLACE FUNCTION public.handle_new_comment_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  parent_author_id uuid;
BEGIN
  IF new.parent_id IS NOT NULL THEN
    -- Get the author of the parent comment
    SELECT user_id INTO parent_author_id FROM public.comments WHERE id = new.parent_id;
    
    -- Don't notify if replying to own comment
    IF parent_author_id != new.user_id THEN
      INSERT INTO public.notifications (user_id, actor_id, type, metadata)
      VALUES (parent_author_id, new.user_id, 'reply', jsonb_build_object('comment_id', new.id, 'parent_id', new.parent_id));
    END IF;
  END IF;
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_comment_reply_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_comment_reply();
