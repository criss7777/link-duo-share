
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmojiReactionsProps {
  linkId: string;
}

const EMOJI_OPTIONS = ['👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🔥', '👏', '✨'];

const EmojiReactions: React.FC<EmojiReactionsProps> = ({ linkId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Fetch reactions for this link
  const { data: reactions = [], isLoading } = useQuery({
    queryKey: ['reactions', linkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reactions')
        .select(`
          id,
          emoji,
          user_id,
          profiles!inner(username)
        `)
        .eq('shared_link_id', linkId);

      if (error) throw error;
      return data || [];
    },
  });

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc: Record<string, Array<{ id: string; user_id: string; username: string }>>, reaction) => {
    const emoji = reaction.emoji || '👍';
    if (!acc[emoji]) {
      acc[emoji] = [];
    }
    acc[emoji].push({
      id: reaction.id,
      user_id: reaction.user_id,
      username: reaction.profiles?.username || 'Unknown'
    });
    return acc;
  }, {});

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      if (!user) throw new Error('Must be logged in');

      // Check if user already reacted with this emoji
      const existingReaction = reactions.find(
        r => r.user_id === user.id && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove existing reaction
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id);
        if (error) throw error;
      } else {
        // Add new reaction
        const { error } = await supabase
          .from('reactions')
          .insert({
            shared_link_id: linkId,
            user_id: user.id,
            emoji: emoji
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', linkId] });
      setShowEmojiPicker(false);
    },
  });

  const handleEmojiClick = (emoji: string) => {
    addReactionMutation.mutate(emoji);
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading reactions...</div>;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Display existing reactions */}
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const userReacted = user && reactionList.some(r => r.user_id === user.id);
        const count = reactionList.length;
        
        return (
          <Button
            key={emoji}
            variant="outline"
            size="sm"
            className={cn(
              "h-8 px-2 text-sm",
              userReacted && "bg-blue-50 border-blue-200 text-blue-700"
            )}
            onClick={() => handleEmojiClick(emoji)}
            title={`${reactionList.map(r => r.username).join(', ')} reacted with ${emoji}`}
          >
            <span className="mr-1">{emoji}</span>
            <span>{count}</span>
          </Button>
        );
      })}

      {/* Add reaction button */}
      {user && (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <span className="text-lg">😊</span>
          </Button>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 grid grid-cols-5 gap-1 z-10">
              {EMOJI_OPTIONS.map(emoji => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmojiReactions;
