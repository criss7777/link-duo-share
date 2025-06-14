
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ExternalLink, MessageCircle, Upload, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LinkCardProps {
  link: {
    id: string;
    url: string;
    title: string | null;
    description: string | null;
    tags: string[] | null;
    sender: string;
    receiver: string;
    is_read: boolean | null;
    created_at: string | null;
    channels?: { name: string };
  };
  onRefresh: () => void;
}

const LinkCard = ({ link, onRefresh }: LinkCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (email, username)
        `)
        .eq('shared_link_id', link.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading comments",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments) {
      loadComments();
    }
  };

  const markAsRead = async () => {
    if (link.is_read || user?.id === link.sender) return;
    
    try {
      const { error } = await supabase
        .from('shared_links')
        .update({ is_read: true })
        .eq('id', link.id);

      if (error) throw error;
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error marking as read",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addComment = async () => {
    if (!newComment.trim() && !file) return;
    
    setLoading(true);
    try {
      let fileUrl = null;
      
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        fileUrl = fileName;
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          shared_link_id: link.id,
          user_id: user?.id,
          content: newComment || 'File attachment',
        });

      if (error) throw error;

      if (fileUrl) {
        const { error: fileError } = await supabase
          .from('files')
          .insert({
            shared_link_id: link.id,
            user_id: user?.id,
            filename: file.name,
            file_path: fileUrl,
            file_size: file.size,
            content_type: file.type,
          });

        if (fileError) console.error('File record error:', fileError);
      }

      setNewComment('');
      setFile(null);
      loadComments();
      toast({
        title: "Comment added",
        description: "Your comment has been posted.",
      });
    } catch (error: any) {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteLink = async () => {
    try {
      const { error } = await supabase
        .from('shared_links')
        .delete()
        .eq('id', link.id);

      if (error) throw error;
      
      onRefresh();
      toast({
        title: "Link deleted",
        description: "The link has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting link",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const canDelete = user?.id === link.sender;
  const isReceiver = user?.id === link.receiver;

  return (
    <Card className={`w-full ${!link.is_read && isReceiver ? 'border-blue-500 border-2' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{link.title || 'Untitled Link'}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <a 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                onClick={markAsRead}
              >
                <ExternalLink className="h-4 w-4" />
                Visit Link
              </a>
              {!link.is_read && isReceiver && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAsRead}
                  className="text-green-600 hover:text-green-800"
                >
                  <Eye className="h-4 w-4" />
                  Mark as Read
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deleteLink}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {link.is_read && isReceiver && (
            <Badge variant="secondary" className="text-green-600">
              Read
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {link.description && (
          <p className="text-gray-600">{link.description}</p>
        )}
        
        {link.tags && link.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {link.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>From: {link.sender}</span>
          <span>{new Date(link.created_at || '').toLocaleDateString()}</span>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleComments}
            className="flex items-center gap-1"
          >
            <MessageCircle className="h-4 w-4" />
            {showComments ? 'Hide Comments' : 'Show Comments'}
          </Button>
        </div>
        
        {showComments && (
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm">{comment.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        By {comment.profiles?.username || comment.profiles?.email} • {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                <Button
                  onClick={addComment}
                  disabled={loading || (!newComment.trim() && !file)}
                  size="sm"
                >
                  {loading ? 'Adding...' : 'Add Comment'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LinkCard;
