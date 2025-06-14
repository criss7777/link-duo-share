
-- Create channels table
CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert the two channels
INSERT INTO public.channels (name) VALUES 
('Upwork jobs'),
('Fun');

-- Add channel_id to shared_links table
ALTER TABLE public.shared_links 
ADD COLUMN channel_id uuid REFERENCES public.channels(id);

-- Update profiles table to use usernames instead of emails for the dropdown
UPDATE public.profiles SET username = 'Kristi' WHERE email = 'user1@example.com';
UPDATE public.profiles SET username = 'Gledi' WHERE email = 'user2@example.com';

-- Enable RLS on channels
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Create policy for channels (everyone can view channels)
CREATE POLICY "Anyone can view channels" ON public.channels
  FOR SELECT USING (true);
