
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant' | 'error' | 'info';
  content: string;
}

const NotesPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || isLoading) return;

    const question = newQuestion.trim();
    setNewQuestion('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsLoading(true);

    try {
      console.log('Sending request to nutrition-assistant function...');
      const { data, error } = await supabase.functions.invoke('nutrition-assistant', {
        body: { 
          question,
          userId: user?.id // Pass the user ID to the function
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      console.log('Response from nutrition-assistant:', data);
      
      if (data.error) {
        console.error('API error:', data.error);
        setMessages(prev => [...prev, { 
          role: 'error', 
          content: `Error: ${data.error}` 
        }]);
        toast.error('API error: ' + data.error);
      } else if (data.answer) {
        if (data.status === 'quota_exceeded') {
          setMessages(prev => [...prev, { 
            role: 'info', 
            content: data.answer
          }]);
          toast.error('The nutrition assistant service is currently disabled.');
        } else if (data.status === 'api_error') {
          setMessages(prev => [...prev, { 
            role: 'info', 
            content: data.answer
          }]);
          toast.error('Technical difficulties with the nutrition assistant.');
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
        }
      } else {
        throw new Error('Invalid response format from nutrition assistant');
      }
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: `Error: ${error.message || 'Failed to get response from the nutrition assistant'}`
      }]);
      
      toast.error('Failed to get response from the nutrition assistant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex flex-col h-full pb-[120px]"> {/* Add padding to account for fixed input */}
        <CardHeader className="py-1 border-b">
          <CardTitle className="text-lg font-bold text-center">
            Nutrition Assistant
          </CardTitle>
        </CardHeader>
        
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <ScrollArea className="absolute inset-0">
            <div className="p-4 space-y-1">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-2 text-xs">
                  Ask me anything about nutrition, recipes, or dietary advice! I'll personalize suggestions based on your workout history.
                </p>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-1 ${
                        message.role === 'user'
                          ? 'bg-client text-white'
                          : message.role === 'error'
                            ? 'bg-red-100 text-red-800'
                            : message.role === 'info'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100'
                      }`}
                    >
                      {message.role === 'error' ? (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                          <p className="text-xs">{message.content}</p>
                        </div>
                      ) : message.role === 'info' ? (
                        <div className="flex items-center gap-1">
                          <Info className="h-3 w-3 text-blue-600" />
                          <p className="text-xs">{message.content}</p>
                        </div>
                      ) : message.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none text-xs">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-xs">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-client" />
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </Card>

      <div className="fixed bottom-[64px] left-0 right-0 bg-background border-t z-50">
        <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6">
          <form onSubmit={handleSubmit} className="flex w-full gap-2 py-3">
            <Textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Ask about nutrition based on your recent workouts..."
              className="flex-1 min-h-[40px] max-h-[60px] text-xs resize-none py-2"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !newQuestion.trim()}
              className="self-end h-8"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotesPage;
