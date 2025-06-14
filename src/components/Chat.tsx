
import ChatHeader from './chat/ChatHeader';
import MessageList from './chat/MessageList';
import MessageInput from './chat/MessageInput';
import { useRealTimeChat } from '@/hooks/useRealTimeChat';

interface ChatProps {
  channelId?: string | null;
  channelName?: string;
}

const Chat = ({ channelName = 'general' }: ChatProps) => {
  const { messages, loading, sendMessage } = useRealTimeChat(channelName);

  return (
    <div className="flex flex-col h-full bg-white">
      <ChatHeader channelName={channelName} />
      <MessageList messages={messages} channelName={channelName} />
      <MessageInput 
        onSendMessage={sendMessage}
        channelName={channelName}
        loading={loading}
      />
    </div>
  );
};

export default Chat;
