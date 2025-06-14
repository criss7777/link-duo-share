
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EmojiReactionsProps {
  linkId: string;
}

const EMOJI_OPTIONS = ['👍', '👎', '😂', '❤️', '🔥', '👀', '🎉', '🤔'];

const EmojiReactions = ({ linkId }: EmojiReactionsProps) => {
  const [reactions, setReactions] = useState<any[]>([]);
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  const loadReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('shared_link_id', linkId);

      if (error) throw error;
      setReactions(data || []);
      
      // Track current user's reactions
      const currentUserReactions = new Set(
        data?.filter(r => r.user_id === user?.id).map(r => r.emoji) || []
      );
      setUserReactions(currentUserReactions);
    } catch (error: any) {
      toast({
        title: "Error loading reactions",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleReaction = async (emoji: string) => {
    try {
      if (userReactions.has(emoji)) {
        // Remove reaction
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('shared_link_id', linkId)
          .eq('user_id', user?.id)
          .eq('emoji', emoji);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from('reactions')
          .insert({
            shared_link_id: linkId,
            user_id: user?.id,
            emoji: emoji,
            reaction_type: 'emoji'
          });

        if (error) throw error;
      }
      
      loadReactions();
    } catch (error: any) {
      toast({
        title: "Error updating reaction",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadReactions();
  }, [linkId]);

  // Group reactions by emoji
  const reactionCounts = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-2">
      {/* Display current reactions */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(reactionCounts).map(([emoji, reactionList]) => (
            <Button
              key={emoji}
              variant="outline"
              size="sm"
              onClick={() => toggleReaction(emoji)}
              className={`h-7 px-2 text-sm ${
                userReactions.has(emoji) ? 'bg-blue-100 border-blue-300' : ''
              }`}
            >
              {emoji} {reactionList.length}
            </Button>
          ))}
        </div>
      )}
      
      {/* Emoji picker */}
      <div className="flex flex-wrap gap-1">
        {EMOJI_OPTIONS.map((emoji) => (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            onClick={() => toggleReaction(emoji)}
            className="h-7 w-7 p-0 hover:bg-gray-100"
          >
            {emoji}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default EmojiReactions;
