
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface CoachInfo {
  id: string;
  profile: {
    bio: string | null;
    avatar_url: string | null;
    favorite_movements: string[] | null;
  };
  user: {
    email: string;
  };
}

interface MoaiCoachTabProps {
  groupId: string;
}

const MoaiCoachTab: React.FC<MoaiCoachTabProps> = ({ groupId }) => {
  // Fetch the coach information for this group
  const { data: coachInfo, isLoading } = useQuery({
    queryKey: ['moai-coach', groupId],
    queryFn: async () => {
      // First, get the coach ID for this group
      const { data: coaches, error: coachError } = await supabase
        .from('group_coaches')
        .select('coach_id')
        .eq('group_id', groupId)
        .limit(1);
      
      if (coachError || !coaches || coaches.length === 0) {
        throw new Error('Coach not found');
      }
      
      const coachId = coaches[0].coach_id;
      
      // Then get the coach profile information
      const { data: profile, error: profileError } = await supabase
        .from('coach_profiles')
        .select('bio, avatar_url, favorite_movements')
        .eq('id', coachId)
        .single();
      
      if (profileError) {
        console.error('Error fetching coach profile:', profileError);
        throw profileError;
      }
      
      // For privacy reasons, we don't fetch actual emails
      // Instead, we create a placeholder
      const email = `coach_${coachId.substring(0, 8)}@example.com`;
      
      return {
        id: coachId,
        profile,
        user: {
          email
        }
      } as CoachInfo;
    },
    retry: 1,
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-client" />
      </div>
    );
  }
  
  if (!coachInfo || !coachInfo.profile) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No coach information available.</p>
        </CardContent>
      </Card>
    );
  }
  
  const { profile } = coachInfo;
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Coach Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url || ''} alt="Coach" />
            <AvatarFallback className="bg-client text-white text-xl">
              {coachInfo.user.email.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div>
              <h3 className="font-semibold text-lg">Coach {coachInfo.user.email.split('@')[0].replace('coach_', '')}</h3>
              <p className="text-muted-foreground text-sm">Certified Fitness Coach</p>
            </div>
            
            {profile.bio && (
              <div>
                <p>{profile.bio}</p>
              </div>
            )}
          </div>
        </div>
        
        <Separator />
        
        {profile.favorite_movements && profile.favorite_movements.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Favorite Ways to Move</h4>
            <div className="flex flex-wrap gap-2">
              {profile.favorite_movements.map(movement => (
                <Badge key={movement} variant="secondary">{movement}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MoaiCoachTab;
