
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AddLinkFormProps {
  onSuccess: () => void;
}

const AddLinkForm = ({ onSuccess }: AddLinkFormProps) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, look up the receiver by email in the profiles table
      const { data: receiverProfile, error: receiverError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', receiverEmail)
        .single();

      if (receiverError || !receiverProfile) {
        throw new Error(`User with email ${receiverEmail} not found. Make sure they have an account.`);
      }

      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const { error } = await supabase
        .from('shared_links')
        .insert({
          url,
          title: title || null,
          description: description || null,
          receiver: receiverProfile.id, // Use the UUID from profiles table
          sender: user?.id,
          tags: tagsArray.length > 0 ? tagsArray : null,
        });

      if (error) throw error;

      // Reset form
      setUrl('');
      setTitle('');
      setDescription('');
      setReceiverEmail('');
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
            <Label htmlFor="receiver">Receiver Email *</Label>
            <Input
              id="receiver"
              type="email"
              placeholder="friend@example.com"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Give your link a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description for context"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
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
