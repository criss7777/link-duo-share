
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

  // Real-time update handler for shared_links
  const handleLinkChange = useCallback((payload: any) => {
    console.log('Real-time link update received:', payload);
    
    // Reload all links to ensure we have complete data with joins
    loadLinks();
  }, [loadLinks]);

  // Real-time update handler for conversations with shared_link_id
  const handleConversationChange = useCallback((payload: any) => {
    // Type guard to safely access shared_link_id
    if (payload.new && typeof payload.new === 'object' && 'shared_link_id' in payload.new && payload.new.shared_link_id) {
      console.log('Chat message with link detected, refreshing links');
      loadLinks();
    }
  }, [loadLinks]);

  // Real-time update handler for reactions
  const handleReactionChange = useCallback((payload: any) => {
    console.log('Real-time reaction update received:', payload);
    // Reactions affect link display, so refresh links
    loadLinks();
  }, [loadLinks]);

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

    // Enhanced real-time subscription for comprehensive synchronization
    const channel = supabase
      .channel('realtime_links_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_links'
        },
        handleLinkChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        handleConversationChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions'
        },
        handleReactionChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, handleLinkChange, handleConversationChange, handleReactionChange]);

  return {
    links,
    receivedLinks,
    sentLinks,
    loading,
    refetch: loadLinks
  };
};
