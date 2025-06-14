
import { Hash } from 'lucide-react';

interface EmptyStateProps {
  channelName: string;
}

const EmptyState = ({ channelName }: EmptyStateProps) => {
  const displayChannelName = channelName === 'All Links' ? 'general' : channelName;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Hash className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">Welcome to #{displayChannelName}</h3>
      <p className="text-slate-500 max-w-sm">
        This is the beginning of the #{displayChannelName} channel. Start the conversation!
      </p>
    </div>
  );
};

export default EmptyState;
