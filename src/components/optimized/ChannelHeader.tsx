
import React, { memo } from 'react';
import { Hash, Users, MessageSquare } from 'lucide-react';

interface ChannelHeaderProps {
  channelName: string;
  linksCount: number;
}

const ChannelHeader = memo(({ channelName, linksCount }: ChannelHeaderProps) => {
  const getChannelDescription = (name: string) => {
    switch (name) {
      case 'Upwork jobs':
        return 'Share job opportunities and work-related links with your team';
      case 'Fun':
        return 'Casual conversations and fun links with chat and reactions';
      default:
        return 'All your shared links across channels in one secure workspace';
    }
  };

  return (
    <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 text-slate-600">
              <Hash className="w-full h-full" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">{channelName}</h1>
          </div>
          {channelName !== 'All Links' && (
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
            <span className="text-sm font-medium">{linksCount}</span>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-slate-600 mt-1">
        {getChannelDescription(channelName)}
      </p>
    </div>
  );
});

ChannelHeader.displayName = 'ChannelHeader';

export default ChannelHeader;
