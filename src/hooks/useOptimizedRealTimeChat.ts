
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { FastEncryption } from '@/utils/encryption';

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

interface OptimisticMessage extends Message {
  isOptimistic?: boolean;
  isSending?: boolean;
}

export const useOptimizedRealTimeChat = (channelName: string) => {
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [sendQueue, setSendQueue] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadOrCreateChannel = useCallback(async () => {
    try {
      // Map the display channel names to the actual database channel names
      let targetChannelName: string;
      if (channelName === 'All Links') {
        targetChannelName = 'general';
      } else if (channelName === 'Upwork jobs') {
        targetChannelName = 'Upwork jobs';
      } else if (channelName === 'Fun') {
        targetChannelName = 'Fun';
      } else {
        targetChannelName = channelName;
      }
      
      let { data, error } = await supabase
        .from('channels')
        .select('id')
        .eq('name', targetChannelName)
        .single();

      if (error && error.code === 'PGRST116') {
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
  }, [channelName, toast]);

  const loadMessages = useCallback(async () => {
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
      
      // Decrypt messages
      const decryptedMessages = data?.map(msg => ({
        ...msg,
        message: FastEncryption.isEncrypted(msg.message) 
          ? FastEncryption.decrypt(msg.message) 
          : msg.message
      })) || [];
      
      setMessages(decryptedMessages);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [currentChannelId, toast]);

  // Optimistic message sending with encryption
  const sendMessage = useCallback(async (message: string) => {
    if (!currentChannelId || !user || !message.trim()) return;
    
    // Create optimistic message immediately
    const optimisticId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMessage: OptimisticMessage = {
      id: optimisticId,
      message: message.trim(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      shared_link_id: null,
      profiles: {
        username: user.email || 'You',
        email: user.email || ''
      },
      isOptimistic: true,
      isSending: true
    };

    // Add to messages immediately for instant feedback
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Encrypt message for database storage
      const encryptedMessage = FastEncryption.encrypt(message.trim());
      
      // Send to database
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          channel_id: currentChannelId,
          user_id: user.id,
          message: encryptedMessage,
          shared_link_id: null,
        })
        .select(`
          *,
          profiles:user_id (username, email)
        `)
        .single();

      if (error) throw error;

      // Update optimistic message with real data
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticId 
          ? { ...data, message: message.trim(), isOptimistic: false, isSending: false }
          : msg
      ));

    } catch (error: any) {
      // Remove failed optimistic message
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      
      toast({
        title: "Failed to send message",
        description: "Message could not be sent. Please try again.",
        variant: "destructive",
      });
    }
  }, [currentChannelId, user, toast]);

  // Batch message processing for faster real-time updates
  const handleMessageChange = useCallback((payload: any) => {
    console.log('Real-time chat update received:', payload);
    
    if (payload.eventType === 'INSERT') {
      const newMessage = payload.new;
      
      // Don't add if it's our own optimistic message
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) return prev;
        
        // Decrypt the message for display
        const decryptedMessage = {
          ...newMessage,
          message: FastEncryption.isEncrypted(newMessage.message) 
            ? FastEncryption.decrypt(newMessage.message) 
            : newMessage.message
        };
        
        return [...prev, decryptedMessage];
      });
      
      // Load complete message data with profile joins after a short delay
      setTimeout(loadMessages, 50);
    } else {
      // For updates/deletes, reload messages
      setTimeout(loadMessages, 100);
    }
  }, [loadMessages]);

  useEffect(() => {
    loadOrCreateChannel();
  }, [loadOrCreateChannel]);

  useEffect(() => {
    if (currentChannelId) {
      loadMessages();
    }
  }, [loadMessages, currentChannelId]);

  useEffect(() => {
    if (!currentChannelId || !user) return;

    const channel = supabase
      .channel(`conversations_realtime_${currentChannelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `channel_id=eq.${currentChannelId}`
        },
        handleMessageChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChannelId, user, handleMessageChange]);

  return {
    messages,
    loading,
    sendMessage,
    currentChannelId
  };
};
