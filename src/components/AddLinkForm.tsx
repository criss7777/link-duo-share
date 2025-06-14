import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const { error } = await supabase
        .from('shared_links')
        .insert({
          url,
          receiver: receiverUserId,
          sender: user?.id,
          channel_id: channelId,
          tags: tagsArray.length > 0 ? tagsArray : null,
        });

      if (error) throw error;

      // Reset form
      setUrl('');
      setReceiverUserId('');
      setChannelId(selectedChannelId || '');
      setTags('');
      
      onSuccess();
      toast({
        title: "Link shared!",
        description: "Your link has been shared successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error sharing link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share a Link</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="receiver">Send to *</Label>
            <Select value={receiverUserId} onValueChange={setReceiverUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel">Channel *</Label>
            <Select value={channelId} onValueChange={setChannelId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a channel" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    # {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="work, important, fun"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sharing...' : 'Share Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddLinkForm;
