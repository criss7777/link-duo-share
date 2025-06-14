
import { Hash } from 'lucide-react';

interface ChatHeaderProps {
  channelName: string;
}

const ChatHeader = ({ channelName }: ChatHeaderProps) => {
  const displayChannelName = channelName === 'All Links' ? 'general' : channelName;

  return (
    <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200">
      <div className="flex items-center gap-3">
        <Hash className="h-5 w-5 text-slate-600" />
        <h2 className="text-xl font-bold text-slate-900">{displayChannelName}</h2>
        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-xs font-medium text-green-700">Active</span>
        </div>
      </div>
      <p className="text-sm text-slate-600 mt-1">
        Team chat for general discussions and updates
      </p>
    </div>
  );
};

export default ChatHeader;
