
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  shared_link_id: string | null;
  profiles?: {
    username: string;
    email: string;
  };
}

export const useRealTimeChat = (channelName: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadOrCreateChannel = async () => {
    try {
      const targetChannelName = channelName === 'All Links' ? 'general' : channelName;
      
      // Try to find existing channel
      let { data, error } = await supabase
        .from('channels')
        .select('id')
        .eq('name', targetChannelName)
        .single();

      if (error && error.code === 'PGRST116') {
        // Channel doesn't exist, create it
        const { data: newChannel, error: createError } = await supabase
          .from('channels')
          .insert({ name: targetChannelName })
          .select('id')
          .single();

        if (createError) throw createError;
        data = newChannel;
      } else if (error) {
        throw error;
      }

      setCurrentChannelId(data.id);
      return data.id;
    } catch (error: any) {
      console.error('Error loading/creating channel:', error);
      toast({
        title: "Error loading chat",
        description: "Could not load the chat channel",
        variant: "destructive",
      });
      return null;
    }
  };

  const loadMessages = async () => {
    if (!currentChannelId) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          profiles:user_id (username, email)
        `)
        .eq('channel_id', currentChannelId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (message: string) => {
    if (!currentChannelId || !user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('conversations')
        .insert({
          channel_id: currentChannelId,
          user_id: user.id,
          message: message,
          shared_link_id: null,
        });

      if (error) throw error;
      // Don't reload here, real-time will handle it
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrCreateChannel();
  }, [channelName]);

  useEffect(() => {
    if (currentChannelId) {
      loadMessages();
    }
  }, [currentChannelId]);

  useEffect(() => {
    if (!currentChannelId || !user) return;

    // Set up real-time subscription for conversations
    const channel = supabase
      .channel(`conversations_${currentChannelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `channel_id=eq.${currentChannelId}`
        },
        (payload) => {
          console.log('Real-time message change:', payload);
          loadMessages(); // Reload messages when any change occurs
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChannelId, user]);

  return {
    messages,
    loading,
    sendMessage,
    currentChannelId
  };
};
