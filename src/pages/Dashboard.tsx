
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import AddLinkForm from '@/components/AddLinkForm';
import Channels from '@/components/Channels';
import ChannelHeader from '@/components/optimized/ChannelHeader';
import TabsContainer from '@/components/optimized/TabsContainer';
import { useOptimizedRealTimeLinks } from '@/hooks/useOptimizedRealTimeLinks';

const Dashboard = () => {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedChannelName, setSelectedChannelName] = useState<string>('All Links');
  const [activeTab, setActiveTab] = useState<string>('received');
  const { user } = useAuth();
  
  const { links, receivedLinks, sentLinks, loading, refetch: refetchLinks } = useOptimizedRealTimeLinks(selectedChannelId);

  const handleChannelSelect = useCallback(async (channelId: string | null) => {
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
  }, []);

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
        
        <div className="flex-1 flex flex-col bg-white border-l border-slate-200">
          <ChannelHeader channelName={selectedChannelName} linksCount={links.length} />

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col">
              <TabsContainer
                activeTab={activeTab}
                onTabChange={setActiveTab}
                receivedLinks={receivedLinks}
                sentLinks={sentLinks}
                onRefresh={refetchLinks}
                selectedChannelId={selectedChannelId}
                selectedChannelName={selectedChannelName}
              />
            </div>

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
