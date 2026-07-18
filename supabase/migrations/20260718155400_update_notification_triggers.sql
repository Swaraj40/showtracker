-- Update trigger for comment likes to include media info
CREATE OR REPLACE FUNCTION public.handle_new_comment_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  comment_author_id uuid;
  c_media_id int;
  c_media_type text;
BEGIN
  SELECT user_id, media_id, media_type INTO comment_author_id, c_media_id, c_media_type FROM public.comments WHERE id = new.comment_id;
  
  IF comment_author_id != new.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, metadata)
    VALUES (comment_author_id, new.user_id, 'like', jsonb_build_object(
      'comment_id', new.comment_id,
      'media_id', c_media_id,
      'media_type', c_media_type
    ));
  END IF;
  
  RETURN new;
END;
$$;

-- Update trigger for comment replies to include media info
CREATE OR REPLACE FUNCTION public.handle_new_comment_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  parent_author_id uuid;
  c_media_id int;
  c_media_type text;
BEGIN
  IF new.parent_id IS NOT NULL THEN
    SELECT user_id, media_id, media_type INTO parent_author_id, c_media_id, c_media_type FROM public.comments WHERE id = new.parent_id;
    
    IF parent_author_id != new.user_id THEN
      INSERT INTO public.notifications (user_id, actor_id, type, metadata)
      VALUES (parent_author_id, new.user_id, 'reply', jsonb_build_object(
        'comment_id', new.id, 
        'parent_id', new.parent_id,
        'media_id', c_media_id,
        'media_type', c_media_type
      ));
    END IF;
  END IF;
  
  RETURN new;
END;
$$;
