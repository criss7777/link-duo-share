
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  channelName: string;
  loading: boolean;
}

const MessageInput = ({ onSendMessage, channelName, loading }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const displayChannelName = channelName === 'All Links' ? 'general' : channelName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;
    
    await onSendMessage(message.trim());
    setMessage('');
  };

  return (
    <div className="flex-shrink-0 p-6 border-t border-slate-200">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <Input
            placeholder={`Message #${displayChannelName}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
            className="h-11 pr-12 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <Button
            type="submit"
            size="sm"
            disabled={loading || !message.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </form>
      <p className="text-xs text-slate-500 mt-2">
        Press Enter to send your message
      </p>
    </div>
  );
};

export default MessageInput;
