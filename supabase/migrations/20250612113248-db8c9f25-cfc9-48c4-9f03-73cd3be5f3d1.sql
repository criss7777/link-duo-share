
-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table for link discussions
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shared_link_id UUID REFERENCES public.shared_links(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create files table for attachments
CREATE TABLE public.files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shared_link_id UUID REFERENCES public.shared_links(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('files', 'files', true);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for shared_links (allow both users to see each other's links)
CREATE POLICY "Users can view shared links where they are sender or receiver" 
  ON public.shared_links FOR SELECT 
  USING (auth.uid()::text = sender OR auth.uid()::text = receiver);

CREATE POLICY "Users can insert shared links where they are sender" 
  ON public.shared_links FOR INSERT 
  WITH CHECK (auth.uid()::text = sender);

CREATE POLICY "Users can update shared links where they are sender" 
  ON public.shared_links FOR UPDATE 
  USING (auth.uid()::text = sender);

CREATE POLICY "Users can delete shared links where they are sender" 
  ON public.shared_links FOR DELETE 
  USING (auth.uid()::text = sender);

-- RLS Policies for comments
CREATE POLICY "Users can view comments on accessible links" 
  ON public.comments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_links 
      WHERE id = shared_link_id 
      AND (sender = auth.uid()::text OR receiver = auth.uid()::text)
    )
  );

CREATE POLICY "Users can insert comments on accessible links" 
  ON public.comments FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.shared_links 
      WHERE id = shared_link_id 
      AND (sender = auth.uid()::text OR receiver = auth.uid()::text)
    )
  );

CREATE POLICY "Users can update own comments" 
  ON public.comments FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" 
  ON public.comments FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for files
CREATE POLICY "Users can view files on accessible content" 
  ON public.files FOR SELECT 
  USING (
    auth.uid() = user_id OR
    (shared_link_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.shared_links 
      WHERE id = shared_link_id 
      AND (sender = auth.uid()::text OR receiver = auth.uid()::text)
    )) OR
    (comment_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.shared_links sl ON c.shared_link_id = sl.id
      WHERE c.id = comment_id 
      AND (sl.sender = auth.uid()::text OR sl.receiver = auth.uid()::text)
    ))
  );

CREATE POLICY "Users can insert own files" 
  ON public.files FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" 
  ON public.files FOR DELETE 
  USING (auth.uid() = user_id);

-- Storage policies for files bucket
CREATE POLICY "Users can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'files' AND auth.role() = 'authenticated');
CREATE POLICY "Users can view files" ON storage.objects FOR SELECT USING (bucket_id = 'files');
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (NEW.id, NEW.email, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for comments
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
