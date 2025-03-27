
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';

interface CoachInfo {
  id: string;
  profile: {
    bio: string | null;
    avatar_url: string | null;
    favorite_movements: string[] | null;
    first_name: string | null;
    last_name: string | null;
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
  const { data: coachInfo, isLoading, error } = useQuery({
    queryKey: ['moai-coach', groupId],
    queryFn: async () => {
      console.log('Fetching coach for group:', groupId);
      
      // First, get the coach ID for this group
      const { data: coaches, error: coachError } = await supabase
        .from('group_coaches')
        .select('coach_id')
        .eq('group_id', groupId)
        .limit(1);
      
      if (coachError) {
        console.error('Error fetching group coach:', coachError);
        throw coachError;
      }
      
      if (!coaches || coaches.length === 0) {
        console.log('No coach found for group:', groupId);
        return null;
      }
      
      const coachId = coaches[0].coach_id;
      console.log('Found coach ID:', coachId);
      
      // Then get the coach profile information
      const { data: profile, error: profileError } = await supabase
        .from('coach_profiles')
        .select('bio, avatar_url, favorite_movements, first_name, last_name')
        .eq('id', coachId)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error fetching coach profile:', profileError);
        
        // If there's an error, provide a minimal profile
        return {
          id: coachId,
          profile: {
            bio: null,
            avatar_url: null,
            favorite_movements: null,
            first_name: null,
            last_name: null
          },
          user: {
            email: `coach_${coachId.substring(0, 8)}`
          }
        } as CoachInfo;
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
    retry: 2,
    staleTime: 300000, // 5 minutes
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-client" />
      </div>
    );
  }
  
  if (error) {
    console.error('Error in coach tab:', error);
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center flex-col text-center gap-2 py-8">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
            <p className="text-muted-foreground">There was an error loading coach information.</p>
            <p className="text-xs text-muted-foreground">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!coachInfo) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground py-8">No coach has been assigned to this group yet.</p>
        </CardContent>
      </Card>
    );
  }
  
  const { profile } = coachInfo;
  
  // Generate coach name based on available profile information
  const coachName = () => {
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    // Fallback to the user email-based name if no profile name exists
    return `Coach ${coachInfo.user.email.split('@')[0].replace('coach_', '')}`;
  };
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Coach Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile?.avatar_url || ''} alt="Coach" />
            <AvatarFallback className="bg-client text-white text-xl">
              {coachName().substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div>
              <h3 className="font-semibold text-lg">{coachName()}</h3>
              <p className="text-muted-foreground text-sm">Certified Fitness Coach</p>
            </div>
            
            {profile?.bio && (
              <div>
                <p>{profile.bio}</p>
              </div>
            )}
          </div>
        </div>
        
        <Separator />
        
        {profile?.favorite_movements && profile.favorite_movements.length > 0 && (
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
