
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

-- Update shared_links sender and receiver columns to be UUIDs
ALTER TABLE public.shared_links 
ALTER COLUMN sender TYPE uuid USING sender::uuid,
ALTER COLUMN receiver TYPE uuid USING receiver::uuid;

-- Add foreign key constraints for sender and receiver
ALTER TABLE public.shared_links 
ADD CONSTRAINT shared_links_sender_fkey FOREIGN KEY (sender) REFERENCES public.profiles(id),
ADD CONSTRAINT shared_links_receiver_fkey FOREIGN KEY (receiver) REFERENCES public.profiles(id);

-- Update existing data to use UUIDs (get the profile IDs based on usernames)
UPDATE public.shared_links 
SET sender = (SELECT id FROM public.profiles WHERE username = 'Kristi')
WHERE sender = 'Kristi';

UPDATE public.shared_links 
SET sender = (SELECT id FROM public.profiles WHERE username = 'Gledi')
WHERE sender = 'Gledi';

UPDATE public.shared_links 
SET receiver = (SELECT id FROM public.profiles WHERE username = 'Kristi')
WHERE receiver = 'Kristi';

UPDATE public.shared_links 
SET receiver = (SELECT id FROM public.profiles WHERE username = 'Gledi')
WHERE receiver = 'Gledi';
