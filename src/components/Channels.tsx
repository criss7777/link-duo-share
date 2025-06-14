
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Channel {
  id: string;
  name: string;
}

interface ChannelsProps {
  selectedChannelId: string | null;
  onChannelSelect: (channelId: string | null) => void;
}

const Channels = ({ selectedChannelId, onChannelSelect }: ChannelsProps) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
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
      toast({
        title: "Error loading channels",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  if (loading) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="text-sm text-gray-500">Loading channels...</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4">Channels</h3>
      <div className="space-y-2">
        <button
          onClick={() => onChannelSelect(null)}
          className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
            selectedChannelId === null
              ? 'bg-blue-100 text-blue-800'
              : 'hover:bg-gray-100'
          }`}
        >
          # All Links
        </button>
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onChannelSelect(channel.id)}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
              selectedChannelId === channel.id
                ? 'bg-blue-100 text-blue-800'
                : 'hover:bg-gray-100'
            }`}
          >
            # {channel.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Channels;
