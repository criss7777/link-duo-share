
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FastEncryption } from '@/utils/encryption';
import { Shield } from 'lucide-react';

interface FunChannelChatProps {
  linkId: string;
}

const FunChannelChat = ({ linkId }: FunChannelChatProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [funChannelId, setFunChannelId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadFunChannelId = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('id')
        .eq('name', 'Fun')
        .single();

      if (error) throw error;
      setFunChannelId(data.id);
    } catch (error: any) {
      console.error('Error loading Fun channel:', error);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (!funChannelId) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          profiles:user_id (email, username)
        `)
        .eq('channel_id', funChannelId)
        .eq('shared_link_id', linkId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Decrypt messages
      const decryptedMessages = data?.map(msg => ({
        ...msg,
        message: FastEncryption.isEncrypted(msg.message) 
          ? FastEncryption.decrypt(msg.message) 
          : msg.message
      })) || [];
      
      setMessages(decryptedMessages);
    } catch (error: any) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [funChannelId, linkId, toast]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !funChannelId) return;
    
    const messageToSend = newMessage.trim();
    setNewMessage(''); // Clear immediately for faster UX
    setLoading(true);
    
    try {
      // Encrypt message
      const encryptedMessage = FastEncryption.encrypt(messageToSend);
      
      const { error } = await supabase
        .from('conversations')
        .insert({
          channel_id: funChannelId,
          shared_link_id: linkId,
          user_id: user?.id,
          message: encryptedMessage,
        });

      if (error) throw error;

      toast({
        title: "Message sent",
        description: "Your message has been posted securely.",
      });
    } catch (error: any) {
      setNewMessage(messageToSend); // Restore on error
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Real-time message handler with decryption
  const handleMessageChange = useCallback((payload: any) => {
    console.log('Real-time fun chat update:', payload);
    if (payload.new && payload.new.shared_link_id === linkId) {
      loadMessages();
    } else if (payload.old && payload.old.shared_link_id === linkId) {
      loadMessages();
    }
  }, [linkId, loadMessages]);

  useEffect(() => {
    loadFunChannelId();
  }, [loadFunChannelId]);

  useEffect(() => {
    if (funChannelId) {
      loadMessages();
    }
  }, [funChannelId, loadMessages]);

  useEffect(() => {
    if (!funChannelId || !linkId) return;

    const channel = supabase
      .channel(`fun_chat_${linkId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `channel_id=eq.${funChannelId}`
        },
        handleMessageChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [funChannelId, linkId, handleMessageChange]);

  return (
    <div className="space-y-3 border rounded-lg p-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Chat about this link</h4>
        <div className="flex items-center gap-1 text-xs text-green-600">
          <Shield className="h-3 w-3" />
          <span>Encrypted</span>
        </div>
      </div>
      
      {/* Messages */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-2">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="bg-white p-2 rounded text-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-900">{message.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    By {message.profiles?.username || message.profiles?.email} • {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Message Input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          rows={2}
          className="text-sm"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button
          onClick={sendMessage}
          disabled={loading || !newMessage.trim()}
          size="sm"
          className="w-full"
        >
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </div>
    </div>
  );
};

export default FunChannelChat;
