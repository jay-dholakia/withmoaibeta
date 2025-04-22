
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { connectToSendbird, createGroupChannel, disconnectFromSendbird } from '@/services/sendbird-service';
import { supabase } from '@/integrations/supabase/client';

export const useGroupChat = (groupId: string) => {
  const [channelUrl, setChannelUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const initializeGroupChat = async () => {
      if (!user?.id || !groupId) return;

      try {
        setIsLoading(true);
        
        // Get all members of the group including coaches
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId);

        const { data: coaches } = await supabase
          .from('group_coaches')
          .select('coach_id')
          .eq('group_id', groupId);

        if (!members || !coaches) {
          throw new Error('Failed to fetch group members or coaches');
        }

        // Combine member and coach IDs
        const userIds = [
          ...members.map(m => m.user_id),
          ...coaches.map(c => c.coach_id)
        ];

        // Connect to Sendbird
        await connectToSendbird(user.id);

        // Create or get existing channel
        const channelName = `group-${groupId}`;
        const groupChannel = await createGroupChannel(userIds, channelName);
        setChannelUrl(groupChannel.url);

      } catch (err) {
        console.error('Error initializing group chat:', err);
        setError('Failed to initialize chat');
      } finally {
        setIsLoading(false);
      }
    };

    initializeGroupChat();

    return () => {
      disconnectFromSendbird();
    };
  }, [user?.id, groupId]);

  return { channelUrl, isLoading, error };
};
