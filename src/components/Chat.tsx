
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Send, Hash } from 'lucide-react';

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

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [generalChannelId, setGeneralChannelId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadGeneralChannelId = async () => {
    try {
      // Try to find existing general channel
      let { data, error } = await supabase
        .from('channels')
        .select('id')
        .eq('name', 'general')
        .single();

      if (error && error.code === 'PGRST116') {
        // Channel doesn't exist, create it
        const { data: newChannel, error: createError } = await supabase
          .from('channels')
          .insert({ name: 'general' })
          .select('id')
          .single();

        if (createError) throw createError;
        data = newChannel;
      } else if (error) {
        throw error;
      }

      setGeneralChannelId(data.id);
    } catch (error: any) {
      console.error('Error loading general channel:', error);
      toast({
        title: "Error loading chat",
        description: "Could not load the general channel",
        variant: "destructive",
      });
    }
  };

  const loadMessages = async () => {
    if (!generalChannelId) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          profiles:user_id (username, email)
        `)
        .eq('channel_id', generalChannelId)
        .is('shared_link_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !generalChannelId || !user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('conversations')
        .insert({
          channel_id: generalChannelId,
          user_id: user.id,
          message: newMessage.trim(),
          shared_link_id: null,
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages();
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (email: string) => {
    if (email === 'user1@example.com') return 'KR';
    if (email === 'user2@example.com') return 'GL';
    return email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (email: string) => {
    if (email === 'user1@example.com') return 'Kristi';
    if (email === 'user2@example.com') return 'Gledi';
    return email.split('@')[0];
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  useEffect(() => {
    loadGeneralChannelId();
  }, []);

  useEffect(() => {
    if (generalChannelId) {
      loadMessages();
    }
  }, [generalChannelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Hash className="h-5 w-5 text-slate-600" />
          <h2 className="text-xl font-bold text-slate-900">general</h2>
          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs font-medium text-green-700">Active</span>
          </div>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          Team chat for general discussions and updates
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Hash className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Welcome to #general</h3>
            <p className="text-slate-500 max-w-sm">
              This is the beginning of the #general channel. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const showAvatar = !prevMessage || 
              prevMessage.user_id !== message.user_id ||
              new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000; // 5 minutes

            return (
              <div key={message.id} className={`flex gap-3 ${showAvatar ? 'mt-4' : 'mt-1'}`}>
                {showAvatar ? (
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback className="bg-slate-200 text-slate-700 text-sm font-medium">
                      {getInitials(message.profiles?.email || '')}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-9 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {showAvatar && (
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-slate-900 text-sm">
                        {message.profiles?.username || getDisplayName(message.profiles?.email || '')}
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
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 p-6 border-t border-slate-200">
        <form onSubmit={sendMessage} className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Message #general"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={loading}
              className="h-11 pr-12 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <Button
              type="submit"
              size="sm"
              disabled={loading || !newMessage.trim()}
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
    </div>
  );
};

export default Chat;
