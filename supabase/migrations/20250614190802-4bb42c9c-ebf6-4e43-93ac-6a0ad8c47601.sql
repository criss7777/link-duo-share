
-- Enable RLS on all tables if not already enabled
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for channels
DROP POLICY IF EXISTS "Anyone can view channels" ON public.channels;
DROP POLICY IF EXISTS "Authenticated users can create channels" ON public.channels;

CREATE POLICY "Anyone can view channels" ON public.channels
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create channels" ON public.channels
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add RLS policies for shared_links  
DROP POLICY IF EXISTS "Users can view relevant links" ON public.shared_links;
DROP POLICY IF EXISTS "Users can create links" ON public.shared_links;
DROP POLICY IF EXISTS "Users can update their own links" ON public.shared_links;

CREATE POLICY "Users can view relevant links" ON public.shared_links
  FOR SELECT USING (
    auth.uid() = sender OR 
    auth.uid() = receiver OR
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can create links" ON public.shared_links
  FOR INSERT WITH CHECK (
    auth.uid() = sender AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own links" ON public.shared_links
  FOR UPDATE USING (
    auth.uid() = receiver AND
    auth.uid() IS NOT NULL
  );

-- Add RLS policies for conversations
DROP POLICY IF EXISTS "Users can view conversations in all channels" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can add messages to any channel" ON public.conversations;

CREATE POLICY "Users can view conversations in all channels" ON public.conversations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can add messages to any channel" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IS NOT NULL
  );

-- Add RLS policies for profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Enable real-time for tables
ALTER TABLE public.shared_links REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.channels REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_links;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
