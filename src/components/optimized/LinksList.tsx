
import React, { memo } from 'react';
import SimplifiedLinkCard from '@/components/SimplifiedLinkCard';

interface Link {
  id: string;
  url: string;
  tags: string[] | null;
  sender: string;
  receiver: string;
  is_read: boolean | null;
  created_at: string | null;
  channels?: { name: string };
}

interface LinksListProps {
  links: Link[];
  onRefresh: () => void;
  emptyMessage?: string;
}

const LinksList = memo(({ links, onRefresh, emptyMessage = "No links received yet" }: LinksListProps) => {
  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <div className="w-6 h-6 text-slate-400">📤</div>
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No links yet</h3>
        <p className="text-slate-500 max-w-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <SimplifiedLinkCard
          key={link.id}
          link={{
            ...link,
            sender: link.sender,
            receiver: link.receiver
          }}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
});

LinksList.displayName = 'LinksList';

export default LinksList;
