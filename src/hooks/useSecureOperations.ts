
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSecurityValidation } from '@/hooks/useSecurityValidation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSecureOperations = () => {
  const { user } = useAuth();
  const { validateSession, validateUserPermissions, sanitizeInput, validateUrl, checkRateLimit } = useSecurityValidation();
  const { toast } = useToast();

  const secureCreateLink = useCallback(async (linkData: {
    url: string;
    receiver: string;
    channelId: string | null;
    title?: string;
    description?: string;
  }) => {
    // Security validations
    if (!await validateSession()) {
      toast({
        title: "Security Error",
        description: "Invalid session. Please log in again.",
        variant: "destructive"
      });
      return { error: 'Invalid session' };
    }

    if (!await validateUserPermissions('create_link')) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to perform this action.",
        variant: "destructive"
      });
      return { error: 'Permission denied' };
    }

    if (!checkRateLimit('create_link', 20, 60000)) {
      toast({
        title: "Rate Limit Exceeded",
        description: "Too many requests. Please wait before trying again.",
        variant: "destructive"
      });
      return { error: 'Rate limit exceeded' };
    }

    if (!validateUrl(linkData.url)) {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid URL.",
        variant: "destructive"
      });
      return { error: 'Invalid URL' };
    }

    // Sanitize inputs
    const sanitizedData = {
      url: sanitizeInput(linkData.url),
      receiver: linkData.receiver,
      channel_id: linkData.channelId,
      title: linkData.title ? sanitizeInput(linkData.title) : null,
      description: linkData.description ? sanitizeInput(linkData.description) : null,
      sender: user?.id
    };

    try {
      const { data, error } = await supabase
        .from('shared_links')
        .insert(sanitizedData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Secure link creation failed:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create link. Please try again.",
        variant: "destructive"
      });
      return { error: error.message };
    }
  }, [user?.id, validateSession, validateUserPermissions, sanitizeInput, validateUrl, checkRateLimit, toast]);

  const secureCreateMessage = useCallback(async (messageData: {
    message: string;
    channelId: string;
  }) => {
    // Security validations
    if (!await validateSession()) {
      toast({
        title: "Security Error",
        description: "Invalid session. Please log in again.",
        variant: "destructive"
      });
      return { error: 'Invalid session' };
    }

    if (!checkRateLimit('create_message', 30, 60000)) {
      toast({
        title: "Rate Limit Exceeded",
        description: "Too many messages. Please slow down.",
        variant: "destructive"
      });
      return { error: 'Rate limit exceeded' };
    }

    // Sanitize message content
    const sanitizedMessage = sanitizeInput(messageData.message);
    
    if (!sanitizedMessage.trim()) {
      toast({
        title: "Invalid Message",
        description: "Message cannot be empty.",
        variant: "destructive"
      });
      return { error: 'Empty message' };
    }

    if (sanitizedMessage.length > 2000) {
      toast({
        title: "Message Too Long",
        description: "Message cannot exceed 2000 characters.",
        variant: "destructive"
      });
      return { error: 'Message too long' };
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          channel_id: messageData.channelId,
          user_id: user?.id,
          message: sanitizedMessage,
          shared_link_id: null
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Secure message creation failed:', error);
      toast({
        title: "Message Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      return { error: error.message };
    }
  }, [user?.id, validateSession, sanitizeInput, checkRateLimit, toast]);

  const secureCreateReaction = useCallback(async (reactionData: {
    emoji: string;
    linkId: string;
  }) => {
    // Security validations
    if (!await validateSession()) {
      return { error: 'Invalid session' };
    }

    if (!checkRateLimit('create_reaction', 50, 60000)) {
      return { error: 'Rate limit exceeded' };
    }

    // Validate emoji
    const allowedEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🚀'];
    if (!allowedEmojis.includes(reactionData.emoji)) {
      return { error: 'Invalid emoji' };
    }

    try {
      const { data, error } = await supabase
        .from('reactions')
        .insert({
          shared_link_id: reactionData.linkId,
          user_id: user?.id,
          emoji: reactionData.emoji
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Secure reaction creation failed:', error);
      return { error: error.message };
    }
  }, [user?.id, validateSession, checkRateLimit]);

  return {
    secureCreateLink,
    secureCreateMessage,
    secureCreateReaction
  };
};
