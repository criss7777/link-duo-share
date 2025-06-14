
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import AddLinkForm from '@/components/AddLinkForm';
import SimplifiedLinkCard from '@/components/SimplifiedLinkCard';
import Channels from '@/components/Channels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Hash, Inbox, Send, Sparkles } from 'lucide-react';

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
          sender_profile:profiles!shared_links_sender_fkey(username),
          receiver_profile:profiles!shared_links_receiver_fkey(username)
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
        sender_name: link.sender_profile?.username || 'Unknown',
        receiver_name: link.receiver_profile?.username || 'Unknown'
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

  // Filter links by sender/receiver using current UUID format
  const sentLinks = links.filter(link => link.sender === user?.id);
  const receivedLinks = links.filter(link => link.receiver === user?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
        <Header />
        <div className="flex">
          <Channels selectedChannelId={selectedChannelId} onChannelSelect={handleChannelSelect} />
          <div className="flex-1 px-6 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3 text-purple-600">
                <div className="w-6 h-6 border-2 border-purple-600/20 border-t-purple-600 rounded-full animate-spin" />
                <span className="text-lg font-medium">Loading your workspace...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <Header />
      
      <div className="flex">
        <Channels selectedChannelId={selectedChannelId} onChannelSelect={handleChannelSelect} />
        
        <div className="flex-1 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Channel Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white">
                  <Hash className="h-5 w-5" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-900 to-pink-700 bg-clip-text text-transparent">
                  {selectedChannelName}
                </h2>
                {selectedChannelName !== 'All Links' && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-full">
                    <Sparkles className="h-3 w-3 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">Active</span>
                  </div>
                )}
              </div>
              <p className="text-slate-600 text-lg">
                {selectedChannelName === 'Upwork jobs' 
                  ? 'Share job opportunities and work-related links with your team' 
                  : selectedChannelName === 'Fun' 
                  ? 'Casual conversations and fun links with chat and reactions'
                  : 'All your shared links across channels in one secure workspace'
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Add Link Form */}
              <div className="xl:col-span-1">
                <div className="sticky top-8">
                  <AddLinkForm onSuccess={loadLinks} selectedChannelId={selectedChannelId} />
                </div>
              </div>
              
              {/* Links Display */}
              <div className="xl:col-span-2">
                <Tabs defaultValue="received" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm border border-purple-200/50">
                    <TabsTrigger 
                      value="received" 
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                    >
                      <Inbox className="h-4 w-4" />
                      Received ({receivedLinks.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="sent"
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                    >
                      <Send className="h-4 w-4" />
                      Sent ({sentLinks.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="received" className="mt-6">
                    <div className="space-y-4">
                      {receivedLinks.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Inbox className="h-8 w-8 text-purple-500" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-700 mb-2">No links received yet</h3>
                          <p className="text-slate-500">
                            {selectedChannelId ? 'No links in this channel yet' : 'Links shared with you will appear here'}
                          </p>
                        </div>
                      ) : (
                        receivedLinks.map((link) => (
                          <SimplifiedLinkCard
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
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Send className="h-8 w-8 text-purple-500" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-700 mb-2">No links sent yet</h3>
                          <p className="text-slate-500">
                            {selectedChannelId ? 'Start sharing links in this channel' : 'Links you share will appear here'}
                          </p>
                        </div>
                      ) : (
                        sentLinks.map((link) => (
                          <SimplifiedLinkCard
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
