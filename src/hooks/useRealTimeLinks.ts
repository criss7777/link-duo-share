
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Link {
  id: string;
  url: string;
  sender: string;
  receiver: string;
  channel_id: string | null;
  tags: string[] | null;
  is_read: boolean | null;
  created_at: string | null;
  channels?: { name: string };
  sender_profile?: { username: string };
  receiver_profile?: { username: string };
  sender_name?: string;
  receiver_name?: string;
}

export const useRealTimeLinks = (selectedChannelId: string | null) => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadLinks = async () => {
    try {
      console.log('Loading links for channel:', selectedChannelId);
      
      let query = supabase
        .from('shared_links')
        .select(`
          *,
          channels(name),
          sender_profile:profiles!shared_links_sender_fkey(username),
          receiver_profile:profiles!shared_links_receiver_fkey(username)
        `)
        .order('created_at', { ascending: false });

      if (selectedChannelId) {
        query = query.eq('channel_id', selectedChannelId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading links:', error);
        throw error;
      }
      
      console.log('Loaded links data:', data);
      
      const transformedData = data?.map(link => ({
        ...link,
        sender_name: link.sender_profile?.username || 'Unknown',
        receiver_name: link.receiver_profile?.username || 'Unknown'
      })) || [];
      
      console.log('Transformed links:', transformedData);
      setLinks(transformedData);
    } catch (error: any) {
      console.error('Error loading links:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [selectedChannelId, user?.id]);

  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for shared_links');

    // Set up real-time subscription for shared_links
    const channel = supabase
      .channel('shared_links_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_links'
        },
        (payload) => {
          console.log('Real-time link change received:', payload);
          
          // For any change (INSERT, UPDATE, DELETE), reload all links
          // This ensures we get the latest data with proper joins
          loadLinks();
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, selectedChannelId]);

  return {
    links,
    loading,
    refetch: loadLinks
  };
};
