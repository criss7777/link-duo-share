
import React, { memo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Inbox, MessageSquare, Send } from 'lucide-react';
import LinksList from './LinksList';
import Chat from '@/components/Chat';

interface TabsContainerProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  receivedLinks: any[];
  sentLinks: any[];
  onRefresh: () => void;
  selectedChannelId: string | null;
  selectedChannelName: string;
}

const TabsContainer = memo(({ 
  activeTab, 
  onTabChange, 
  receivedLinks, 
  sentLinks,
  onRefresh, 
  selectedChannelId, 
  selectedChannelName 
}: TabsContainerProps) => {
  return (
    <div className="flex-1 overflow-hidden">
      <Tabs value={activeTab} onValueChange={onTabChange} className="h-full flex flex-col">
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
              value="sent" 
              className="flex items-center gap-2 px-4 h-8 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600"
            >
              <Send className="h-4 w-4" />
              Sent ({sentLinks.length})
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
            <LinksList 
              links={receivedLinks} 
              onRefresh={onRefresh}
              emptyMessage={selectedChannelId ? 'No links in this channel yet' : 'Links shared with you will appear here'}
              showReadStatus={false}
            />
          </TabsContent>

          <TabsContent value="sent" className="h-full p-6 m-0">
            <LinksList 
              links={sentLinks} 
              onRefresh={onRefresh}
              emptyMessage={selectedChannelId ? 'No links sent in this channel yet' : 'Links you have shared will appear here'}
              showReadStatus={true}
            />
          </TabsContent>

          <TabsContent value="chat" className="h-full m-0">
            <Chat channelId={selectedChannelId} channelName={selectedChannelName} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
});

TabsContainer.displayName = 'TabsContainer';

export default TabsContainer;
