
-- Drop the check constraint that's causing the issue
ALTER TABLE public.shared_links DROP CONSTRAINT IF EXISTS shared_links_receiver_check;

-- Also drop any other check constraints that might be related to sender/receiver
ALTER TABLE public.shared_links DROP CONSTRAINT IF EXISTS shared_links_sender_check;
