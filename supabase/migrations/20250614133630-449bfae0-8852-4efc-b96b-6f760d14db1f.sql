
-- Drop the existing restrictive policies that only allow Fun channel
DROP POLICY IF EXISTS "Anyone can view Fun channel conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can add messages to Fun channel only" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own Fun channel messages" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own Fun channel messages" ON public.conversations;

-- Create new policies that work for all channels
CREATE POLICY "Users can view conversations in all channels" ON public.conversations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add messages to any channel" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own messages in any channel" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = user_id AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete their own messages in any channel" ON public.conversations
  FOR DELETE USING (
    auth.uid() = user_id AND
    auth.uid() IS NOT NULL
  );
