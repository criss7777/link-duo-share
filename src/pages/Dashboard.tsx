
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import AddLinkForm from '@/components/AddLinkForm';
import SimplifiedLinkCard from '@/components/SimplifiedLinkCard';
import Channels from '@/components/Channels';
import Chat from '@/components/Chat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useRealTimeLinks } from '@/hooks/useRealTimeLinks';
import { Hash, Inbox, MessageSquare, Users } from 'lucide-react';

const Dashboard = () => {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedChannelName, setSelectedChannelName] = useState<string>('All Links');
  const [activeTab, setActiveTab] = useState<string>('received');
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use the real-time hook for links
  const { links, loading, refetch: refetchLinks } = useRealTimeLinks(selectedChannelId);

  const handleChannelSelect = async (channelId: string | null) => {
    console.log('Channel selected:', channelId);
    setSelectedChannelId(channelId);
    
    if (channelId) {
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

  // Auto-select Upwork jobs channel and set default channel for new links
  useEffect(() => {
    const loadUpworkChannel = async () => {
      try {
        let { data, error } = await supabase
          .from('channels')
          .select('id, name')
          .eq('name', 'Upwork jobs')
          .single();

        if (error && error.code === 'PGRST116') {
          // Channel doesn't exist, create it
          const { data: newChannel, error: createError } = await supabase
            .from('channels')
            .insert({ name: 'Upwork jobs' })
            .select('id, name')
            .single();

          if (createError) throw createError;
          data = newChannel;
        } else if (error) {
          throw error;
        }

        if (data) {
          setSelectedChannelId(data.id);
          setSelectedChannelName(data.name);
        }
      } catch (error: any) {
        console.error('Error setting up Upwork jobs channel:', error);
      }
    };

    loadUpworkChannel();
  }, []);

  // Filter received links for the current user
  const receivedLinks = links.filter(link => {
    console.log('Filtering link:', link, 'user:', user?.id);
    return link.receiver === user?.id;
  });

  console.log('Received links:', receivedLinks);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
        <Header />
        <div className="flex flex-1">
          <Channels selectedChannelId={selectedChannelId} onChannelSelect={handleChannelSelect} />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3 text-slate-600">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              <span className="text-lg font-medium">Loading workspace...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Channels selectedChannelId={selectedChannelId} onChannelSelect={handleChannelSelect} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white border-l border-slate-200">
          {/* Channel Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 text-slate-600">
                    <Hash className="w-full h-full" />
                  </div>
                  <h1 className="text-xl font-bold text-slate-900">
                    {selectedChannelName}
                  </h1>
                </div>
                {selectedChannelName !== 'All Links' && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs font-medium text-green-700">Active</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-slate-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">2</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">{links.length}</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mt-1">
              {selectedChannelName === 'Upwork jobs' 
                ? 'Share job opportunities and work-related links with your team' 
                : selectedChannelName === 'Fun' 
                ? 'Casual conversations and fun links with chat and reactions'
                : 'All your shared links across channels in one secure workspace'
              }
            </p>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Links Display */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100">
                    <TabsList className="h-10 bg-slate-100 p-1 rounded-lg">
                      <TabsTrigger 
                        value="received" 
                        className="flex items-center gap-2 px-4 h-8 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600"
                      >
                        <Inbox className="h-4 w-4" />
                        Received ({receivedLinks.length})
                      </TabsTrigger>
                      <TabsTrigger 
                        value="chat"
                        className="flex items-center gap-2 px-4 h-8 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Team Chat
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <div className="flex-1 overflow-auto">
                    <TabsContent value="received" className="h-full p-6 m-0">
                      <div className="space-y-3">
                        {receivedLinks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                              <Inbox className="h-6 w-6 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">No links received yet</h3>
                            <p className="text-slate-500 max-w-sm">
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
                              onRefresh={refetchLinks}
                            />
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="chat" className="h-full m-0">
                      <Chat channelId={selectedChannelId} channelName={selectedChannelName} />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>

            {/* Right Sidebar - Add Link Form */}
            <div className="w-80 border-l border-slate-200 bg-[#f8f9fa] p-6 overflow-auto">
              <div className="sticky top-0">
                <AddLinkForm onSuccess={refetchLinks} selectedChannelId={selectedChannelId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
