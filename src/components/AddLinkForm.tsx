import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Link2, Users, Hash, Tag } from 'lucide-react';

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
        title: "Link shared successfully!",
        description: "Your link has been securely shared with the team.",
      });
    } catch (error: any) {
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
    <Card className="shadow-lg border-purple-200/50 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white">
            <Plus className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl bg-gradient-to-r from-purple-900 to-pink-700 bg-clip-text text-transparent">
            Share a Link
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center gap-2 text-slate-700 font-medium">
              <Link2 className="h-4 w-4 text-purple-600" />
              URL *
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="h-11 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="receiver" className="flex items-center gap-2 text-slate-700 font-medium">
              <Users className="h-4 w-4 text-purple-600" />
              Send to *
            </Label>
            <Select value={receiverUserId} onValueChange={setReceiverUserId}>
              <SelectTrigger className="h-11 border-purple-200 focus:border-purple-400">
                <SelectValue placeholder="Select a team member" />
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
            <Label htmlFor="channel" className="flex items-center gap-2 text-slate-700 font-medium">
              <Hash className="h-4 w-4 text-purple-600" />
              Channel *
            </Label>
            <Select value={channelId} onValueChange={setChannelId}>
              <SelectTrigger className="h-11 border-purple-200 focus:border-purple-400">
                <SelectValue placeholder="Select a channel" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3 text-slate-500" />
                      {channel.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center gap-2 text-slate-700 font-medium">
              <Tag className="h-4 w-4 text-purple-600" />
              Tags (optional)
            </Label>
            <Input
              id="tags"
              placeholder="work, important, urgent"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="h-11 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
            />
            <p className="text-xs text-slate-500">Separate tags with commas</p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 text-base bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold shadow-lg" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Sharing link...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Share Link Securely
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddLinkForm;
