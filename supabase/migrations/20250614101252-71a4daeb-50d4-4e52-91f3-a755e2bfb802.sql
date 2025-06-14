
-- Add a new conversation table for the Fun channel
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id),
  shared_link_id UUID REFERENCES public.shared_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations that restrict to Fun channel only
CREATE POLICY "Anyone can view Fun channel conversations" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.channels 
      WHERE id = channel_id AND name = 'Fun'
    )
  );

CREATE POLICY "Users can add messages to Fun channel only" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.channels 
      WHERE id = channel_id AND name = 'Fun'
    )
  );

CREATE POLICY "Users can update their own Fun channel messages" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.channels 
      WHERE id = channel_id AND name = 'Fun'
    )
  );

CREATE POLICY "Users can delete their own Fun channel messages" ON public.conversations
  FOR DELETE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.channels 
      WHERE id = channel_id AND name = 'Fun'
    )
  );

-- Create index for faster queries
CREATE INDEX conversations_channel_id_idx ON public.conversations(channel_id);
CREATE INDEX conversations_shared_link_id_idx ON public.conversations(shared_link_id);

-- Modify the reactions table to be more Slack-like
ALTER TABLE public.reactions DROP CONSTRAINT IF EXISTS reactions_reaction_type_check;
ALTER TABLE public.reactions ADD COLUMN emoji TEXT NOT NULL DEFAULT '👍';
