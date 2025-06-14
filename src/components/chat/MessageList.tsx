
import { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import EmptyState from './EmptyState';
import { getUserUtils } from '../../utils/userUtils';
import { formatTime } from '../../utils/timeUtils';

interface Message {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  profiles?: {
    username: string;
    email: string;
  };
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
      {messages.map((message, index) => {
        const prevMessage = messages[index - 1];
        const showAvatar = !prevMessage || 
          prevMessage.user_id !== message.user_id ||
          new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000; // 5 minutes

        return (
          <div key={message.id} className={`flex gap-3 ${showAvatar ? 'mt-4' : 'mt-1'}`}>
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
                </div>
              )}
              <div className={`text-sm text-slate-800 leading-relaxed ${!showAvatar ? 'ml-0' : ''}`}>
                {message.message}
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
