
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, RefreshCw } from 'lucide-react';
import { BuddyDisplayInfo } from '@/services/accountability-buddy-service';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AccountabilityBuddyCardProps {
  buddies: BuddyDisplayInfo[];
  isAdmin?: boolean;
  groupId: string;
  onRefresh?: () => Promise<void>;
  loading?: boolean;
}

export function AccountabilityBuddyCard({
  buddies,
  isAdmin = false,
  groupId,
  onRefresh,
  loading = false
}: AccountabilityBuddyCardProps) {
  const navigate = useNavigate();

  const handleClick = (buddyId: string) => {
    navigate(`/client-dashboard/moai/members/${buddyId}`);
  };

  const handleRefresh = async () => {
    try {
      if (onRefresh) {
        await onRefresh();

        // Use upsert approach to handle conflicts
        const response = await fetch(
          `https://gjrheltyxjilxcphbzdj.supabase.co/rest/v1/accountability_buddies`,
          {
            method: 'POST',
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_API_KEY!,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_API_KEY!}`,
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
              group_id: groupId,
              user_id_1: buddies[0]?.userId || null,
              user_id_2: buddies[1]?.userId || null,
              user_id_3: buddies[2]?.userId || null,
              week_start: new Date().toISOString().split('T')[0]
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Supabase error: ${response.statusText}`);
        }

        toast.success('Accountability Buddies Updated');
      }
    } catch (error) {
      console.error('Error creating buddy pairings:', error);
      toast.error('Could not refresh buddy pairings. Please try again later.');
    }
  };

  return (
    <Card className="border-none shadow-none bg-slate-50 mt-3">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <UserCheck className="h-4 w-4 mr-2 text-client" />
            <h3 className="font-medium text-sm">This Week's Accountability Buddy</h3>
          </div>

          <Badge className="text-xs bg-white">
            Refreshes Monday
          </Badge>

          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-xs">Refresh</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {buddies.length > 0 ? (
            buddies.map((buddy) => (
              <div
                key={buddy.userId}
                className="flex items-center p-2 rounded-md bg-white border cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleClick(buddy.userId)}
              >
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={buddy.avatarUrl || ''} />
                  <AvatarFallback className="bg-client/80 text-white text-xs">
                    {buddy.firstName ? buddy.firstName.charAt(0).toUpperCase() : ''}
                    {buddy.lastName ? buddy.lastName.charAt(0).toUpperCase() : ''}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{buddy.name}</span>
              </div>
            ))
          ) : (
            <div className="col-span-2 p-3 bg-white border rounded-md text-center text-sm text-muted-foreground">
              No accountability buddy assigned yet for this week.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
