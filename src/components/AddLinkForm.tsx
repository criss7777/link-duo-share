
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Send, Link2, Tag } from 'lucide-react';

interface AddLinkFormProps {
  onSuccess: () => void;
  selectedChannelId?: string | null;
}

interface Channel {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  username: string;
}

const AddLinkForm = ({ onSuccess, selectedChannelId }: AddLinkFormProps) => {
  const [url, setUrl] = useState('');
  const [receiverUserId, setReceiverUserId] = useState('');
  const [channelId, setChannelId] = useState(selectedChannelId || '');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('name');

      if (error) throw error;
      setChannels(data || []);
    } catch (error: any) {
      console.error('Error loading channels:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .not('username', 'is', null)
        .order('username');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error loading profiles:', error);
    }
  };

  useEffect(() => {
    loadChannels();
    loadProfiles();
  }, []);

  useEffect(() => {
    setChannelId(selectedChannelId || '');
  }, [selectedChannelId]);

  const postChatMessage = async (linkId: string, receiverUsername: string) => {
    try {
      console.log('Posting chat message with:', { linkId, receiverUsername, channelId, userId: user?.id });
      
      const message = `📎 New link shared with @${receiverUsername}: ${url}`;
      
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          channel_id: channelId,
          shared_link_id: linkId,
          user_id: user?.id,
          message: message,
        })
        .select();

      if (error) {
        console.error('Error posting chat message:', error);
        throw error;
      }
      
      console.log('Chat message posted successfully:', data);
    } catch (error: any) {
      console.error('Failed to post chat message:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!receiverUserId) {
        throw new Error('Please select a receiver');
      }

      if (!channelId) {
        throw new Error('Please select a channel');
      }

      console.log('Submitting link with:', { url, receiverUserId, channelId, sender: user?.id });

      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const { data: linkData, error: linkError } = await supabase
        .from('shared_links')
        .insert({
          url,
          receiver: receiverUserId,
          sender: user?.id,
          channel_id: channelId,
          tags: tagsArray.length > 0 ? tagsArray : null,
        })
        .select('id')
        .single();

      if (linkError) {
        console.error('Error creating link:', linkError);
        throw linkError;
      }

      console.log('Link created successfully:', linkData);

      // Get receiver username for the chat message
      const receiverProfile = profiles.find(p => p.id === receiverUserId);
      
      if (linkData?.id && receiverProfile) {
        try {
          await postChatMessage(linkData.id, receiverProfile.username);
          console.log('Chat message posted successfully');
        } catch (chatError) {
          console.error('Chat message failed but link was shared:', chatError);
          // Continue with success since link was shared
        }
      }

      // Reset form
      setUrl('');
      setReceiverUserId('');
      setChannelId(selectedChannelId || '');
      setTags('');
      
      onSuccess();
      toast({
        title: "Link shared!",
        description: "Your link has been shared successfully and posted to team chat.",
      });
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Failed to share link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Send className="h-5 w-5 text-slate-600" />
          Share Link
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-medium text-slate-700">
              Link URL
            </Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="pl-10 h-9 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="receiver" className="text-sm font-medium text-slate-700">
              Send to
            </Label>
            <Select value={receiverUserId} onValueChange={setReceiverUserId}>
              <SelectTrigger className="h-9 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <SelectValue placeholder="Select team member">
                  {receiverUserId && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      {profiles.find(p => p.id === receiverUserId)?.username}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      {profile.username}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel" className="text-sm font-medium text-slate-700">
              Channel
            </Label>
            <Select value={channelId} onValueChange={setChannelId}>
              <SelectTrigger className="h-9 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <SelectValue placeholder="Select channel">
                  {channelId && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">#</span>
                      {channels.find(c => c.id === channelId)?.name}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">#</span>
                      {channel.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium text-slate-700">
              Tags <span className="text-slate-400 text-xs">(optional)</span>
            </Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="tags"
                placeholder="work, important, urgent"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="pl-10 h-9 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-slate-500">Separate with commas</p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-9 bg-[#007a5a] hover:bg-[#006644] text-white font-medium shadow-sm" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Sharing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Share Link
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddLinkForm;
