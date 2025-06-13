
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import AddLinkForm from '@/components/AddLinkForm';
import LinkCard from '@/components/LinkCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
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
  }, []);

  // Now we can directly compare UUIDs since both sender/receiver are UUID type
  const sentLinks = links.filter(link => link.sender === user?.id);
  const receivedLinks = links.filter(link => link.receiver === user?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Link Form */}
          <div className="lg:col-span-1">
            <AddLinkForm onSuccess={loadLinks} />
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
                      No links received yet
                    </div>
                  ) : (
                    receivedLinks.map((link) => (
                      <LinkCard
                        key={link.id}
                        link={link}
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
                      No links sent yet
                    </div>
                  ) : (
                    sentLinks.map((link) => (
                      <LinkCard
                        key={link.id}
                        link={link}
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
  );
};

export default Dashboard;
