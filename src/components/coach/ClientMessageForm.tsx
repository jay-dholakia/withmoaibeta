
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Send } from 'lucide-react';
import { saveCoachMessage, fetchCoachMessagesForClient } from '@/services/coach-client-message-service';
import { toast } from 'sonner';
import { SheetTitle } from '@/components/ui/sheet';

interface ClientMessageFormProps {
  coachId: string;
  clientId: string;
  clientEmail: string;
  onClose: () => void;
}

const ClientMessageForm: React.FC<ClientMessageFormProps> = ({ 
  coachId, 
  clientId,
  clientEmail, 
  onClose 
}) => {
  const [message, setMessage] = useState('');
  const [existingMessageId, setExistingMessageId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const getCurrentWeekDate = () => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday
    const diff = now.getDate() - day;
    return new Date(now.setDate(diff));
  };
  
  useEffect(() => {
    const fetchExistingMessage = async () => {
      setIsLoading(true);
      try {
        const messages = await fetchCoachMessagesForClient(coachId, clientId);
        if (messages && messages.length > 0) {
          const currentWeekDate = getCurrentWeekDate();
          const currentWeekMessage = messages.find(msg => 
            new Date(msg.week_of).getTime() === currentWeekDate.getTime()
          );
          
          if (currentWeekMessage) {
            setMessage(currentWeekMessage.message);
            setExistingMessageId(currentWeekMessage.id);
          }
        }
      } catch (error) {
        console.error('Error fetching existing message:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExistingMessage();
  }, [coachId, clientId]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    setIsSaving(true);
    try {
      const weekDate = getCurrentWeekDate();
      const result = await saveCoachMessage(
        coachId, 
        clientId, 
        message, 
        weekDate,
        existingMessageId
      );
      
      if (result) {
        toast.success('Message saved successfully');
        onClose();
      } else {
        toast.error('Failed to save message');
      }
    } catch (error) {
      console.error('Error saving message:', error);
      toast.error('An error occurred while saving the message');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <SheetTitle className="text-lg font-medium">
        Weekly Message for {clientEmail}
      </SheetTitle>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-coach" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your weekly message here..."
                className="min-h-[150px]"
              />
              
              <div className="text-xs text-muted-foreground mt-2">
                This message will be saved for the week of {getCurrentWeekDate().toLocaleDateString()}.
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-coach hover:bg-coach/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Save Message
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ClientMessageForm;
