
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { connectToSendbird, disconnectFromSendbird, getMessages, sendMessage } from '@/services/sendbird-service';

export const useSendbirdChat = (channelUrl?: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const initializeChat = async () => {
      if (!user?.id || !channelUrl) return;
      
      try {
        setIsLoading(true);
        await connectToSendbird(user.id);
        const initialMessages = await getMessages(channelUrl);
        setMessages(initialMessages);
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError('Failed to initialize chat');
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    return () => {
      disconnectFromSendbird();
    };
  }, [user?.id, channelUrl]);

  const sendChatMessage = async (message: string) => {
    if (!channelUrl) return;
    
    try {
      const sentMessage = await sendMessage(channelUrl, message);
      setMessages(prev => [...prev, sentMessage]);
      return sentMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
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
