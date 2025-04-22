
import React, { useState } from 'react';
import { ClientLayout } from '@/layouts/ClientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, MessageCircle } from 'lucide-react';
import { Chat } from '@/components/chat/Chat';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useGroupChat } from '@/hooks/useGroupChat';

const MoaiPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('chat');

  const { data: userGroup, isLoading: isLoadingGroup } = useQuery({
    queryKey: ['user-group', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { channelUrl, isLoading: isLoadingChat, error: chatError } = useGroupChat(userGroup?.group_id || '');

  if (isLoadingGroup) {
    return (
      <ClientLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-client" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-client flex items-center gap-2">
          <Users className="h-8 w-8" /> Moai Group
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Group Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Group Chat</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="mt-4">
                {isLoadingChat ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : chatError ? (
                  <div className="text-center text-red-500 py-8">
                    {chatError}
                  </div>
                ) : channelUrl ? (
                  <Chat channelUrl={channelUrl} />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Chat not available
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
};

export default MoaiPage;
