
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import AddLinkForm from '@/components/AddLinkForm';
import LinkCard from '@/components/LinkCard';
import Channels from '@/components/Channels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedChannelName, setSelectedChannelName] = useState<string>('All Links');
  const { user } = useAuth();
  const { toast } = useToast();

  const loadLinks = async () => {
    try {
      let query = supabase
        .from('shared_links')
        .select(`
          *,
          channels(name),
          sender_profile:sender(username, email),
          receiver_profile:receiver(username, email)
        `)
        .order('created_at', { ascending: false });

      // Filter by channel if one is selected
      if (selectedChannelId) {
        query = query.eq('channel_id', selectedChannelId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to include readable sender/receiver names
      const transformedData = data?.map(link => ({
        ...link,
        sender_name: link.sender_profile?.username || link.sender_profile?.email || 'Unknown',
        receiver_name: link.receiver_profile?.username || link.receiver_profile?.email || 'Unknown'
      })) || [];
      
      setLinks(transformedData);
    } catch (error: any) {
      toast({
        title: "Error loading links",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [selectedChannelId]);

  const handleChannelSelect = async (channelId: string | null) => {
    setSelectedChannelId(channelId);
    
    if (channelId) {
      // Get channel name for display
      const { data } = await supabase
        .from('channels')
        .select('name')
        .eq('id', channelId)
        .single();
      
      setSelectedChannelName(data?.name || 'Unknown Channel');
    } else {
      setSelectedChannelName('All Links');
    }
  };

  // Filter links by sender/receiver using UUIDs
  const sentLinks = links.filter(link => link.sender === user?.id);
  const receivedLinks = links.filter(link => link.receiver === user?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Channels selectedChannelId={selectedChannelId} onChannelSelect={handleChannelSelect} />
          <div className="flex-1 px-4 py-8">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Channels selectedChannelId={selectedChannelId} onChannelSelect={handleChannelSelect} />
        
        <div className="flex-1 px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                # {selectedChannelName}
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedChannelName === 'Upwork jobs' 
                  ? 'Share job opportunities and work-related links' 
                  : selectedChannelName === 'Fun' 
                  ? 'Casual conversations and fun links'
                  : 'All your shared links across channels'
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Add Link Form */}
              <div className="lg:col-span-1">
                <AddLinkForm onSuccess={loadLinks} selectedChannelId={selectedChannelId} />
              </div>
              
              {/* Links Display */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="received" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="received">
                      Received ({receivedLinks.length})
                    </TabsTrigger>
                    <TabsTrigger value="sent">
                      Sent ({sentLinks.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="received" className="mt-6">
                    <div className="space-y-4">
                      {receivedLinks.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No links received yet{selectedChannelId ? ' in this channel' : ''}
                        </div>
                      ) : (
                        receivedLinks.map((link) => (
                          <LinkCard
                            key={link.id}
                            link={{
                              ...link,
                              sender: link.sender_name,
                              receiver: link.receiver_name
                            }}
                            onRefresh={loadLinks}
                          />
                        ))
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="sent" className="mt-6">
                    <div className="space-y-4">
                      {sentLinks.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No links sent yet{selectedChannelId ? ' in this channel' : ''}
                        </div>
                      ) : (
                        sentLinks.map((link) => (
                          <LinkCard
                            key={link.id}
                            link={{
                              ...link,
                              sender: link.sender_name,
                              receiver: link.receiver_name
                            }}
                            onRefresh={loadLinks}
                          />
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
