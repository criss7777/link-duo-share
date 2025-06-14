
import { useState, useEffect, useCallback, useMemo } from 'react';
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

export const useOptimizedRealTimeLinks = (selectedChannelId: string | null) => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadLinks = useCallback(async () => {
    if (!user) return;
    
    try {
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

      if (error) throw error;
      
      const transformedData = data?.map(link => ({
        ...link,
        sender_name: link.sender_profile?.username || 'Unknown',
        receiver_name: link.receiver_profile?.username || 'Unknown'
      })) || [];
      
      setLinks(transformedData);
    } catch (error) {
      console.error('Error loading links:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedChannelId, user?.id]);

  // Memoize filtered received links to prevent unnecessary re-renders
  const receivedLinks = useMemo(() => {
    return links.filter(link => link.receiver === user?.id);
  }, [links, user?.id]);

  // Memoize filtered sent links to prevent unnecessary re-renders
  const sentLinks = useMemo(() => {
    return links.filter(link => link.sender === user?.id);
  }, [links, user?.id]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  useEffect(() => {
    if (!user) return;

    // Enhanced real-time subscription for better synchronization
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
          console.log('Real-time link update received:', payload);
          // Immediately reload links to ensure synchronization
          loadLinks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          // Also listen to conversations table for chat-related link updates
          if (payload.new?.shared_link_id) {
            console.log('Chat message with link detected, refreshing links');
            loadLinks();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLinks, user?.id]);

  return {
    links,
    receivedLinks,
    sentLinks,
    loading,
    refetch: loadLinks
  };
};
