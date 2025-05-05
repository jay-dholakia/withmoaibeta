
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, subscribeToRoom, fetchMessages, sendMessage } from '@/services/chat';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useSendbirdChat = (channelUrl: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const fetchInitialMessages = async () => {
      try {
        setIsLoading(true);
        const fetchedMessages = await fetchMessages(channelUrl);
        setMessages(fetchedMessages);
        setError(null);

        // Subscribe to new messages
        channel = subscribeToRoom(channelUrl, (newMessage) => {
          setMessages(prev => [...prev, newMessage]);
        });
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (channelUrl) {
      fetchInitialMessages();
    }

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [channelUrl]);

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

  return {
    messages,
    isLoading,
    error,
    sendMessage: sendChatMessage
  };
};
