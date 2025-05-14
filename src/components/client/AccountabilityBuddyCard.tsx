
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, MessageSquare, Users } from 'lucide-react';
import { BuddyDisplayInfo, getCurrentWeekStart } from '@/services/accountability-buddy-service';
import { useNavigate } from 'react-router-dom';
import { getBuddyChatRoom } from '@/services/chat/room-service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AccountabilityBuddyCardProps {
  buddies: BuddyDisplayInfo[];
  isAdmin?: boolean;
  groupId: string;
  onRefresh?: () => Promise<void>;
  loading?: boolean;
}

export const AccountabilityBuddyCard: React.FC<AccountabilityBuddyCardProps> = ({
  buddies,
  isAdmin,
  groupId,
  onRefresh,
  loading
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCreatingChat, setIsCreatingChat] = React.useState(false);
  
  const handleChatWithBuddies = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to chat with buddies");
      return;
    }
    
    setIsCreatingChat(true);
    try {
      // First find the accountability_buddies record for this group
      const weekStart = getCurrentWeekStart();
      
      console.log("Finding accountability buddies record for week:", weekStart);
      
      // Look for a record that contains all these users and is for the current week
      const { data: buddyRecords, error: buddyError } = await supabase
        .from("accountability_buddies")
        .select("*")
        .eq("week_start", weekStart)
        .eq("group_id", groupId)
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id},user_id_3.eq.${user.id}`);
      
      if (buddyError) {
        console.error("Error finding accountability buddies record:", buddyError);
        toast.error("Failed to find buddy pairing");
        return;
      }
      
      if (!buddyRecords || buddyRecords.length === 0) {
        console.error("No accountability buddies record found");
        toast.error("No buddy pairing found for this week");
        return;
      }
      
      // Get the first matching record
      const buddyRecord = buddyRecords[0];
      
      console.log("Found accountability buddies record:", buddyRecord);
      
      // Navigate directly to the chat page
      navigate(`/client-dashboard/chat?buddy=true`);
    } catch (error) {
      console.error("Error navigating to buddy chat:", error);
      toast.error("Failed to open buddy chat");
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <Card className="bg-muted/40 dark:bg-gray-800/50 mb-2">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
            <h3 className="text-sm font-medium">Weekly Accountability Buddies</h3>
          </div>
          
          <div className="flex items-center gap-2">
            {isAdmin && onRefresh && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onRefresh}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                <span className="sr-only">Refresh buddies</span>
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleChatWithBuddies}
              disabled={isCreatingChat || buddies.length === 0}
              className="flex items-center gap-1 text-xs"
            >
              {isCreatingChat ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <MessageSquare className="h-3 w-3" />
              )}
              <span>Chat</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : buddies.length === 0 ? (
          <p className="text-xs text-muted-foreground py-1">
            No accountability buddies assigned for this week.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-3">
            You have {buddies.length} {buddies.length === 1 ? 'buddy' : 'buddies'} assigned for this week.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
