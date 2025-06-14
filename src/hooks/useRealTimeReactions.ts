
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  shared_link_id: string;
  created_at: string;
}

export const useRealTimeReactions = (linkId: string) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadReactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('shared_link_id', linkId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReactions(data || []);
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  }, [linkId]);

  const addReaction = useCallback(async (emoji: string) => {
    if (!user || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('reactions')
        .insert({
          shared_link_id: linkId,
          user_id: user.id,
          emoji: emoji,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding reaction:', error);
    } finally {
      setLoading(false);
    }
  }, [linkId, user, loading]);

  const removeReaction = useCallback(async (reactionId: string) => {
    if (!user || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', reactionId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing reaction:', error);
    } finally {
      setLoading(false);
    }
  }, [user, loading]);

  // Real-time reaction handler
  const handleReactionChange = useCallback((payload: any) => {
    console.log('Real-time reaction update:', payload);
    loadReactions();
  }, [loadReactions]);

  useEffect(() => {
    loadReactions();
  }, [loadReactions]);

  useEffect(() => {
    if (!linkId) return;

    const channel = supabase
      .channel(`reactions_${linkId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `shared_link_id=eq.${linkId}`
        },
        handleReactionChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [linkId, handleReactionChange]);

  return {
    reactions,
    loading,
    addReaction,
    removeReaction
  };
};
