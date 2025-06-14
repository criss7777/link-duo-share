
-- Drop all policies on comments table that might reference shared_links.sender
DROP POLICY IF EXISTS "Users can view comments on accessible links" ON public.comments;
DROP POLICY IF EXISTS "Users can insert comments on accessible links" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- Drop all policies on files table that might reference shared_links.sender
DROP POLICY IF EXISTS "Users can view files on accessible content" ON public.files;
DROP POLICY IF EXISTS "Users can insert own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete own files" ON public.files;

-- Drop all policies on shared_links table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'shared_links' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.shared_links';
    END LOOP;
END $$;

-- Now disable RLS on all related tables
ALTER TABLE public.shared_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;

-- Remove any foreign key constraints that might interfere
ALTER TABLE public.shared_links DROP CONSTRAINT IF EXISTS shared_links_sender_fkey;
ALTER TABLE public.shared_links DROP CONSTRAINT IF EXISTS shared_links_receiver_fkey;

-- Now we can safely alter the column types
ALTER TABLE public.shared_links 
ALTER COLUMN sender TYPE uuid USING sender::uuid,
ALTER COLUMN receiver TYPE uuid USING receiver::uuid;

-- Add foreign key constraints for sender and receiver
ALTER TABLE public.shared_links 
ADD CONSTRAINT shared_links_sender_fkey FOREIGN KEY (sender) REFERENCES public.profiles(id),
ADD CONSTRAINT shared_links_receiver_fkey FOREIGN KEY (receiver) REFERENCES public.profiles(id);

-- Update existing data to use UUIDs
UPDATE public.shared_links 
SET sender = (SELECT id FROM public.profiles WHERE username = 'Kristi')
WHERE sender::text = 'Kristi';

UPDATE public.shared_links 
SET sender = (SELECT id FROM public.profiles WHERE username = 'Gledi')
WHERE sender::text = 'Gledi';

UPDATE public.shared_links 
SET receiver = (SELECT id FROM public.profiles WHERE username = 'Kristi')
WHERE receiver::text = 'Kristi';

UPDATE public.shared_links 
SET receiver = (SELECT id FROM public.profiles WHERE username = 'Gledi')
WHERE receiver::text = 'Gledi';

-- Re-enable RLS and recreate policies for shared_links
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shared links where they are sender or receiver" ON public.shared_links
  FOR SELECT USING (auth.uid() = sender OR auth.uid() = receiver);

CREATE POLICY "Users can insert shared links where they are sender" ON public.shared_links
  FOR INSERT WITH CHECK (auth.uid() = sender);

CREATE POLICY "Users can update their own shared links" ON public.shared_links
  FOR UPDATE USING (auth.uid() = sender);

CREATE POLICY "Users can delete their own shared links" ON public.shared_links
  FOR DELETE USING (auth.uid() = sender);

-- Re-enable RLS and recreate policies for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on accessible links" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shared_links 
      WHERE id = shared_link_id 
      AND (sender = auth.uid() OR receiver = auth.uid())
    )
  );

CREATE POLICY "Users can insert comments on accessible links" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.shared_links 
      WHERE id = shared_link_id 
      AND (sender = auth.uid() OR receiver = auth.uid())
    )
  );

CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Re-enable RLS and recreate policies for files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files on accessible content" ON public.files
  FOR SELECT USING (
    auth.uid() = user_id OR
    (shared_link_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.shared_links 
      WHERE id = shared_link_id 
      AND (sender = auth.uid() OR receiver = auth.uid())
    )) OR
    (comment_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.shared_links sl ON c.shared_link_id = sl.id
      WHERE c.id = comment_id 
      AND (sl.sender = auth.uid() OR sl.receiver = auth.uid())
    ))
  );

CREATE POLICY "Users can insert own files" ON public.files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" ON public.files
  FOR DELETE USING (auth.uid() = user_id);

-- Create reactions table
CREATE TABLE public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_link_id uuid REFERENCES public.shared_links(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id),
  reaction_type text CHECK (reaction_type IN ('like', 'dislike')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(shared_link_id, user_id)
);

-- Enable RLS on reactions
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for reactions
CREATE POLICY "Users can view all reactions" ON public.reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own reactions" ON public.reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions" ON public.reactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON public.reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger for reactions
CREATE TRIGGER update_reactions_updated_at
  BEFORE UPDATE ON public.reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can view files" ON storage.objects
  FOR SELECT USING (bucket_id = 'files');

CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);
