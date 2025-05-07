
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, MessageSquare } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
  
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName && firstName[0] ? firstName[0] : '';
    const last = lastName && lastName[0] ? lastName[0] : '';
    return (first + last).toUpperCase();
  };
  
  const handleChatWithBuddies = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to chat with buddies");
      return;
    }
    
    if (buddies.length === 0) {
      toast.error("No buddies assigned for this week");
      return;
    }
    
    if (!groupId) {
      toast.error("Group ID is required to create buddy chat");
      return;
    }
    
    setIsCreatingChat(true);
    try {
      // Get all buddy IDs including the current user
      const allBuddyIds = [user.id, ...buddies.map(b => b.userId)];
      
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
      
      console.log("Creating buddy chat with record ID:", buddyRecord.id);
      
      // Create or get the buddy chat room using the accountability buddies record ID
      const roomId = await getBuddyChatRoom(allBuddyIds, buddyRecord.id);
      
      if (roomId) {
        // Navigate to the chat page with the room ID
        navigate(`/client-dashboard/chat?buddy=${roomId}`);
      } else {
        toast.error("Couldn't create buddy chat room");
      }
    } catch (error) {
      console.error("Error creating buddy chat:", error);
      toast.error("Failed to open buddy chat");
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <Card className="bg-muted/40 dark:bg-gray-800/50 mb-2">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">Weekly Accountability Buddies</h3>
          
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
          <>
            <div className="flex flex-wrap gap-2 justify-center">
              {buddies.map((buddy) => (
                <div key={buddy.userId} className="flex flex-col items-center">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={buddy.avatarUrl || ''} alt={buddy.name} />
                    <AvatarFallback>{getInitials(buddy.firstName, buddy.lastName)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs mt-1 whitespace-nowrap max-w-[80px] truncate">
                    {buddy.name}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-3 flex justify-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleChatWithBuddies}
                disabled={isCreatingChat}
                className="flex items-center gap-1 text-xs"
              >
                {isCreatingChat ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <MessageSquare className="h-3 w-3" />
                )}
                <span>Chat with {buddies.length > 1 ? 'Buddies' : 'Buddy'}</span>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
