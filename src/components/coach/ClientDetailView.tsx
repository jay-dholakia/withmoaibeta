import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, User, Calendar, MapPin, Dumbbell, Award, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientProfile } from '@/types/workout';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ClientDetailViewProps {
  clientId: string;
  clientEmail: string;
  onClose: () => void;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({ 
  clientId, 
  clientEmail,
  onClose 
}) => {
  const navigate = useNavigate();
  const [programType, setProgramType] = useState<string | null>(null);
  
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['client-profile', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('id', clientId)
        .single();
        
      if (error) {
        console.error('Error fetching client profile:', error);
        throw error;
      }
      
      return data as ClientProfile;
    }
  });
  
  // Fetch program type
  useEffect(() => {
    const fetchProgramType = async () => {
      try {
        const { data, error } = await supabase
          .from('client_profiles')
          .select('program_type')
          .eq('id', clientId)
          .single();
          
        if (error) {
          console.error('Error fetching program type:', error);
          return;
        }
        
        setProgramType(data?.program_type || 'strength');
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    fetchProgramType();
  }, [clientId]);

  const handleEditSettings = () => {
    onClose();
    navigate('/coach-dashboard/client-settings');
  };

  if (isLoading) {
    return (
      <div className="h-full space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Client Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Separator />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="py-4">
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Client Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Separator className="my-4" />
        <div className="flex flex-col items-center justify-center h-[300px] text-center">
          <div className="text-destructive mb-2">Error loading client details</div>
          <p className="text-muted-foreground text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Client Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Separator className="my-4" />
      
      <ScrollArea className="pr-4 h-[calc(100vh-10rem)]">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="mr-2 h-4 w-4" />
                Contact Information
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={handleEditSettings}
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Edit Settings</span>
              </Button>
            </div>
            
            <div className="space-y-2">
              <div>
                <div className="text-sm font-medium">Email</div>
                <div>{clientEmail}</div>
              </div>
              
              {profile && (
                <>
                  <div>
                    <div className="text-sm font-medium">Name</div>
                    <div>
                      {profile.first_name && profile.last_name 
                        ? `${profile.first_name} ${profile.last_name}`
                        : "Not provided"}
                    </div>
                  </div>
                  
                  {(profile.city || profile.state) && (
                    <div>
                      <div className="text-sm font-medium flex items-center">
                        <MapPin className="mr-1 h-3 w-3" /> Location
                      </div>
                      <div>{[profile.city, profile.state].filter(Boolean).join(', ')}</div>
                    </div>
                  )}
                </>
              )}
              
              <div>
                <div className="text-sm font-medium">Program Type</div>
                <Badge variant="secondary" className="mt-1 font-normal">
                  {programType === 'run' ? 'Moai Run' : 'Moai Strength'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Profile Details
            </h3>
            
            {profile && (
              <div className="space-y-2 mt-2">
                <div>
                  <div className="text-sm font-medium">Birthday</div>
                  <div>{profile.birthday || "Not provided"}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Height</div>
                  <div>{profile.height || "Not provided"}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Weight</div>
                  <div>{profile.weight || "Not provided"}</div>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold flex items-center">
              <Award className="mr-2 h-4 w-4" />
              Event Information
            </h3>
            
            {profile && (
              <div className="space-y-2 mt-2">
                <div>
                  <div className="text-sm font-medium">Event Type</div>
                  <div>{profile.event_type || "No event specified"}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Event Date</div>
                  <div>{profile.event_date || "No date specified"}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Event Name</div>
                  <div>{profile.event_name || "No name specified"}</div>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">Fitness Goals</h3>
            
            {profile && profile.fitness_goals && profile.fitness_goals.length > 0 ? (
              <ul className="list-disc pl-5 mt-2">
                {profile.fitness_goals.map((goal, index) => (
                  <li key={index}>{goal}</li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground mt-2">No fitness goals specified.</div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">Favorite Movements</h3>
            
            {profile && profile.favorite_movements && profile.favorite_movements.length > 0 ? (
              <ul className="list-disc pl-5 mt-2">
                {profile.favorite_movements.map((movement, index) => (
                  <li key={index}>{movement}</li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground mt-2">No favorite movements specified.</div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
