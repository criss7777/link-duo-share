
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRealTimeReactions } from '@/hooks/useRealTimeReactions';
import { useAuth } from '@/hooks/useAuth';

interface EmojiReactionsProps {
  linkId: string;
}

const EmojiReactions = ({ linkId }: EmojiReactionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { reactions, loading, addReaction, removeReaction } = useRealTimeReactions(linkId);
  const { user } = useAuth();

  const availableEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🚀'];

  // Group reactions by emoji and count them
  const reactionGroups = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        count: 0,
        users: [],
        hasUserReacted: false,
        reactionId: null
      };
    }
    acc[reaction.emoji].count++;
    acc[reaction.emoji].users.push(reaction.user_id);
    
    if (reaction.user_id === user?.id) {
      acc[reaction.emoji].hasUserReacted = true;
      acc[reaction.emoji].reactionId = reaction.id;
    }
    
    return acc;
  }, {} as Record<string, { count: number; users: string[]; hasUserReacted: boolean; reactionId: string | null }>);

  const handleEmojiClick = async (emoji: string) => {
    const group = reactionGroups[emoji];
    
    if (group?.hasUserReacted && group.reactionId) {
      await removeReaction(group.reactionId);
    } else {
      await addReaction(emoji);
    }
    
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Display existing reactions */}
      {Object.entries(reactionGroups).map(([emoji, group]) => (
        <Button
          key={emoji}
          variant={group.hasUserReacted ? "default" : "outline"}
          size="sm"
          className="h-8 px-2 text-sm"
          onClick={() => handleEmojiClick(emoji)}
          disabled={loading}
        >
          <span className="mr-1">{emoji}</span>
          <span>{group.count}</span>
        </Button>
      ))}

      {/* Add reaction button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-gray-500 hover:text-gray-700"
          >
            <span className="text-lg">😊</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="grid grid-cols-4 gap-1">
            {availableEmojis.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-gray-100"
                onClick={() => handleEmojiClick(emoji)}
                disabled={loading}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default EmojiReactions;
