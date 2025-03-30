
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Send } from 'lucide-react';
import { saveCoachMessage, fetchCoachMessagesForClient, canCoachMessageClient } from '@/services/coach-client-message-service';
import { toast } from 'sonner';
import { SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { isFuture } from 'date-fns';

interface ClientMessageFormProps {
  coachId: string;
  clientId: string;
  clientEmail: string;
  onClose: () => void;
  editMessage?: {
    id: string;
    message: string;
    weekOf: string;
  };
}

const ClientMessageForm: React.FC<ClientMessageFormProps> = ({ 
  coachId, 
  clientId,
  clientEmail, 
  onClose,
  editMessage 
}) => {
  const [message, setMessage] = useState('');
  const [existingMessageId, setExistingMessageId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);
  const [programWeek, setProgramWeek] = useState<number | null>(null);
  
  const getCurrentWeekDate = () => {
    if (editMessage) {
      return new Date(editMessage.weekOf);
    }
    
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday
    const diff = now.getDate() - day;
    return new Date(now.setDate(diff));
  };
  
  const calculateProgramWeek = async () => {
    try {
      const dateToUse = getCurrentWeekDate();
      
      const { data, error } = await supabase
        .from('program_assignments')
        .select('start_date, program_id')
        .eq('user_id', clientId)
        .order('start_date', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error fetching program assignment:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        const assignment = data[0];
        const startDate = new Date(assignment.start_date);
        
        if (isFuture(startDate)) {
          setProgramWeek(0);
          return 0;
        }
        
        if (dateToUse < startDate) {
          setProgramWeek(0);
          return 0;
        }
        
        const diffTime = dateToUse.getTime() - startDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        const weekNumber = Math.floor(diffDays / 7) + 1;
        
        setProgramWeek(weekNumber);
        return weekNumber;
      }
      
      setProgramWeek(0);
      return 0;
    } catch (error) {
      console.error('Error calculating program week:', error);
      setProgramWeek(0);
      return 0;
    }
  };
  
  useEffect(() => {
    const checkPermissionAndFetchMessage = async () => {
      setIsLoading(true);
      try {
        const canMessage = await canCoachMessageClient(coachId, clientId);
        setHasPermission(canMessage);
        
        if (!canMessage) {
          toast.error("You don't have permission to message this client");
          setIsLoading(false);
          return;
        }
        
        if (editMessage) {
          setMessage(editMessage.message);
          setExistingMessageId(editMessage.id);
        } else {
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
        }
        
        await calculateProgramWeek();
      } catch (error) {
        console.error('Error initializing message form:', error);
        toast.error('Could not load existing messages');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkPermissionAndFetchMessage();
  }, [coachId, clientId, editMessage]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasPermission) {
      toast.error("You don't have permission to message this client");
      return;
    }
    
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    setIsSaving(true);
    try {
      const weekDate = getCurrentWeekDate();
      const weekDateString = weekDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      const result = await saveCoachMessage(
        coachId, 
        clientId, 
        message, 
        weekDateString,
        existingMessageId
      );
      
      if (result) {
        toast.success('Message saved successfully');
        onClose();
      } else {
        toast.error('Failed to save message');
      }
    } catch (error: any) {
      console.error('Error saving message:', error);
      toast.error(error.message || 'An error occurred while saving the message');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!hasPermission) {
    return (
      <div className="space-y-4">
        <SheetTitle className="text-lg font-medium">
          {editMessage ? 'Edit Message' : 'Weekly Message'} for {clientEmail}
        </SheetTitle>
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          You don't have permission to send messages to this client. 
          This usually means the client is not in any of your coaching groups.
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <SheetTitle className="text-lg font-medium">
        {editMessage ? 'Edit Message' : 'Weekly Message'} for {clientEmail}
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
                This message will be saved for {programWeek !== null ? `Week ${programWeek}` : 'Week 0'} 
                (week of {getCurrentWeekDate().toLocaleDateString()}).
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
                  {editMessage ? 'Update' : 'Save'} Message
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
