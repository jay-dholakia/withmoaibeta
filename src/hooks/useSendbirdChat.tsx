
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, subscribeToRoom, fetchMessages, sendMessage } from '@/services/chat';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';

export const useSendbirdChat = (channelUrl: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    let messageChannel: RealtimeChannel | null = null;
    let presenceChannel: RealtimeChannel | null = null;

    const fetchInitialMessages = async () => {
      try {
        setIsLoading(true);
        const fetchedMessages = await fetchMessages(channelUrl);
        setMessages(fetchedMessages);
        setError(null);

        // Subscribe to new messages
        messageChannel = subscribeToRoom(channelUrl, (newMessage) => {
          setMessages(prev => [...prev, newMessage]);
        });
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    // Subscribe to online presence
    const setupPresence = async () => {
      if (!user?.id) return;
      
      presenceChannel = supabase.channel('online-users')
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel?.presenceState() || {};
          const online = new Set<string>();
          
          // Process presence state to extract online users
          Object.keys(state).forEach(presenceKey => {
            const presences = state[presenceKey] as Array<{ user_id: string }>;
            presences.forEach(presence => {
              if (presence.user_id) {
                online.add(presence.user_id);
              }
            });
          });
          
          setOnlineUsers(online);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Track the current user's presence
            await presenceChannel?.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        });
    };

    if (channelUrl) {
      fetchInitialMessages();
    }

    setupPresence();

    return () => {
      if (messageChannel) {
        messageChannel.unsubscribe();
      }
      if (presenceChannel) {
        presenceChannel.unsubscribe();
      }
    };
  }, [channelUrl, user?.id]);

  const sendChatMessage = async (content: string) => {
    if (!content.trim()) return;
    
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error('Not authenticated');
      
      const result = await sendMessage(channelUrl, content, data.user.id);
      return result;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId);
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage: sendChatMessage,
    onlineUsers,
    isUserOnline,
  };
};
