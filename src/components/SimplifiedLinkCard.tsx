
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MessageCircle, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import EmojiReactions from './EmojiReactions';
import FunChannelChat from './FunChannelChat';

interface SimplifiedLinkCardProps {
  link: {
    id: string;
    url: string;
    tags: string[] | null;
    sender: string;
    receiver: string;
    is_read: boolean | null;
    created_at: string | null;
    channels?: { name: string };
  };
  onRefresh: () => void;
}

const SimplifiedLinkCard = ({ link, onRefresh }: SimplifiedLinkCardProps) => {
  const [showChat, setShowChat] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const markAsRead = async () => {
    if (link.is_read || user?.id === link.sender) return;
    
    try {
      const { error } = await supabase
        .from('shared_links')
        .update({ is_read: true })
        .eq('id', link.id);

      if (error) throw error;
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error marking as read",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteLink = async () => {
    try {
      const { error } = await supabase
        .from('shared_links')
        .delete()
        .eq('id', link.id);

      if (error) throw error;
      
      onRefresh();
      toast({
        title: "Link deleted",
        description: "The link has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting link",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const canDelete = user?.id === link.sender;
  const isReceiver = user?.id === link.receiver;
  const isFunChannel = link.channels?.name === 'Fun';

  return (
    <Card className={`w-full ${!link.is_read && isReceiver ? 'border-blue-500 border-2' : ''}`}>
      <CardContent className="p-4 space-y-3">
        {/* Link URL and Actions */}
        <div className="flex items-center justify-between">
          <a 
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 flex-1 truncate"
            onClick={markAsRead}
          >
            <ExternalLink className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{link.url}</span>
          </a>
          
          <div className="flex items-center gap-2 ml-2">
            {!link.is_read && isReceiver && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAsRead}
                className="text-green-600 hover:text-green-800"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteLink}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tags */}
        {link.tags && link.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {link.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>From: {link.sender}</span>
          <div className="flex items-center gap-2">
            {link.is_read && isReceiver && (
              <Badge variant="secondary" className="text-green-600 text-xs">
                Read
              </Badge>
            )}
            <span>{new Date(link.created_at || '').toLocaleDateString()}</span>
          </div>
        </div>
        
        {/* Emoji Reactions */}
        <EmojiReactions linkId={link.id} />
        
        {/* Chat Toggle for Fun Channel */}
        {isFunChannel && (
          <div className="border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-1"
            >
              <MessageCircle className="h-4 w-4" />
              {showChat ? 'Hide Chat' : 'Show Chat'}
            </Button>
            
            {showChat && (
              <div className="mt-3">
                <FunChannelChat linkId={link.id} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimplifiedLinkCard;
