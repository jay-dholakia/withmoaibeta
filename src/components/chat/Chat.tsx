
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSendbirdChat } from '@/hooks/useSendbirdChat';
import { Loader2 } from 'lucide-react';

interface ChatProps {
  channelUrl: string;
}

export const Chat: React.FC<ChatProps> = ({ channelUrl }) => {
  const [newMessage, setNewMessage] = useState('');
  const { messages, isLoading, error, sendMessage } = useSendbirdChat(channelUrl);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-[400px] text-red-500">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {messages.map((message: any) => (
              <div
                key={message.messageId}
                className={`flex ${
                  message.sender.userId === message._sender.userId
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.sender.userId === message._sender.userId
                      ? 'bg-client text-white'
                      : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-100'
                  }`}
                >
                  <p className="text-sm font-medium">
                    {message.sender.nickname || message.sender.userId}
                  </p>
                  <p>{message.message}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-400"
          />
          <Button type="submit">Send</Button>
        </form>
      </CardFooter>
    </Card>
  );
};
