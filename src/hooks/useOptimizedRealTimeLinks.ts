
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

  // Optimistic update for instant display
  const addOptimisticLink = useCallback((newLink: Partial<Link>) => {
    const optimisticLink: Link = {
      id: `temp-${Date.now()}`,
      url: newLink.url || '',
      sender: newLink.sender || user?.id || '',
      receiver: newLink.receiver || '',
      channel_id: newLink.channel_id || null,
      tags: newLink.tags || null,
      is_read: false,
      created_at: new Date().toISOString(),
      sender_name: 'You',
      receiver_name: newLink.receiver_name || 'Unknown'
    };

    setLinks(prevLinks => [optimisticLink, ...prevLinks]);
    return optimisticLink.id;
  }, [user?.id]);

  // Update optimistic link with real data
  const updateOptimisticLink = useCallback((tempId: string, realLink: Link) => {
    setLinks(prevLinks => 
      prevLinks.map(link => 
        link.id === tempId ? realLink : link
      )
    );
  }, []);

  // Remove failed optimistic link
  const removeOptimisticLink = useCallback((tempId: string) => {
    setLinks(prevLinks => prevLinks.filter(link => link.id !== tempId));
  }, []);

  // Real-time update handler for shared_links with immediate updates
  const handleLinkChange = useCallback((payload: any) => {
    console.log('Real-time link update received:', payload);
    
    if (payload.eventType === 'INSERT') {
      // For new links, add them immediately if they're not already there (avoid duplicates from optimistic updates)
      const newLink = payload.new;
      setLinks(prevLinks => {
        // Check if this link already exists (from optimistic update or otherwise)
        const exists = prevLinks.some(link => link.id === newLink.id);
        if (exists) {
          // Update existing link with complete data
          return prevLinks.map(link => 
            link.id === newLink.id || (link.id.startsWith('temp-') && link.url === newLink.url && link.sender === newLink.sender)
              ? { ...newLink, sender_name: 'Loading...', receiver_name: 'Loading...' }
              : link
          );
        } else {
          // Add new link
          return [{ ...newLink, sender_name: 'Loading...', receiver_name: 'Loading...' }, ...prevLinks];
        }
      });
      
      // Load complete link data with profile joins
      setTimeout(loadLinks, 100);
    } else if (payload.eventType === 'UPDATE') {
      // Handle updates (like read status changes)
      const updatedLink = payload.new;
      setLinks(prevLinks =>
        prevLinks.map(link =>
          link.id === updatedLink.id ? { ...link, ...updatedLink } : link
        )
      );
    } else if (payload.eventType === 'DELETE') {
      // Handle deletions
      const deletedId = payload.old.id;
      setLinks(prevLinks => prevLinks.filter(link => link.id !== deletedId));
    }
  }, [loadLinks]);

  // Real-time update handler for conversations with shared_link_id
  const handleConversationChange = useCallback((payload: any) => {
    if (payload.new && typeof payload.new === 'object' && 'shared_link_id' in payload.new && payload.new.shared_link_id) {
      console.log('Chat message with link detected, refreshing links');
      // Small delay to ensure consistency
      setTimeout(loadLinks, 50);
    }
  }, [loadLinks]);

  // Real-time update handler for reactions
  const handleReactionChange = useCallback((payload: any) => {
    console.log('Real-time reaction update received:', payload);
    // Reactions affect link display, so refresh links with minimal delay
    setTimeout(loadLinks, 50);
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

    // Enhanced real-time subscription for immediate synchronization
    const channel = supabase
      .channel('instant_links_sync')
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
    refetch: loadLinks,
    addOptimisticLink,
    updateOptimisticLink,
    removeOptimisticLink
  };
};
