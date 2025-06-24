
import { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import EmptyState from './EmptyState';
import { getUserUtils } from '../../utils/userUtils';
import { formatTime } from '../../utils/timeUtils';
import { Loader2, Shield } from 'lucide-react';

interface Message {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  profiles?: {
    username: string;
    email: string;
  };
  isOptimistic?: boolean;
  isSending?: boolean;
}

interface MessageListProps {
  messages: Message[];
  channelName: string;
}

const MessageList = ({ messages, channelName }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return <EmptyState channelName={channelName} />;
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      {/* Encryption notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg py-2 px-3 mx-4">
        <Shield className="h-3 w-3" />
        <span>Messages are encrypted end-to-end</span>
      </div>
      
      {messages.map((message, index) => {
        const prevMessage = messages[index - 1];
        const showAvatar = !prevMessage || 
          prevMessage.user_id !== message.user_id ||
          new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000; // 5 minutes

        return (
          <div key={message.id} className={`flex gap-3 ${showAvatar ? 'mt-4' : 'mt-1'} ${message.isOptimistic ? 'opacity-80' : ''}`}>
            {showAvatar ? (
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarFallback className="bg-slate-200 text-slate-700 text-sm font-medium">
                  {getUserUtils.getInitials(message.profiles?.email || '')}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-9 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              {showAvatar && (
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-slate-900 text-sm">
                    {message.profiles?.username || getUserUtils.getDisplayName(message.profiles?.email || '')}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatTime(message.created_at)}
                  </span>
                  {message.isSending && (
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                </div>
              )}
              <div className={`text-sm text-slate-800 leading-relaxed ${!showAvatar ? 'ml-0' : ''} flex items-center gap-2`}>
                <span>{message.message}</span>
                {message.isSending && !showAvatar && (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
