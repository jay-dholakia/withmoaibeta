import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ClientProfile, fetchClientProfile, updateClientProfile } from '@/services/client-service';
import { ProfileBuilderLayout } from '@/components/client/ProfileBuilder/ProfileBuilderLayout';
import { ProfileBuilderStepOne } from '@/components/client/ProfileBuilder/ProfileBuilderStepOne';
import { ProfileBuilderStepTwo } from '@/components/client/ProfileBuilder/ProfileBuilderStepTwo';
import { ProfileBuilderStepThree } from '@/components/client/ProfileBuilder/ProfileBuilderStepThree';
import { Loader2, ChevronLeft } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const TOTAL_STEPS = 3;

const ProfileEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<Partial<ClientProfile>>({});
  const [isRedirecting, setIsRedirecting] = useState(false);

  const fromSettings = location.state?.from === 'settings';

  const { data: profile, isLoading } = useQuery({
    queryKey: ['client-profile-edit', user?.id],
    queryFn: async () => {
      console.log('ProfileEditor: Fetching profile for user:', user?.id);
      if (!user?.id) throw new Error('User not authenticated');
      try {
        const result = await fetchClientProfile(user.id);
        console.log('ProfileEditor: Fetch result:', result);
        
        if (result.birthday) {
          const date = new Date(result.birthday);
          console.log('ProfileEditor: Birthday loaded:', result.birthday);
          console.log('As UTC date components:', {
            utcYear: date.getUTCFullYear(),
            utcMonth: date.getUTCMonth() + 1,
            utcDay: date.getUTCDate()
          });
        }
        
        return result;
      } catch (error) {
        console.error('ProfileEditor: Error fetching profile:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: 3,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<ClientProfile>) => {
      if (!user?.id) throw new Error('User not authenticated');
      console.log('ProfileEditor: Updating profile with data:', data);
      
      if (data.birthday) {
        const date = new Date(data.birthday);
        console.log('Birthday to be saved:', data.birthday);
        console.log('As UTC date components:', {
          utcYear: date.getUTCFullYear(),
          utcMonth: date.getUTCMonth() + 1,
          utcDay: date.getUTCDate()
        });
      }
      
      return updateClientProfile(user.id, data);
    },
    onSuccess: () => {
      toast.success('Your profile has been updated!');
      setIsRedirecting(true);
      setTimeout(() => navigate('/client-dashboard/settings'), 1500);
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('There was an error updating your profile');
    },
  });

  useEffect(() => {
    if (profile) {
      console.log('Profile data loaded:', profile);
      if (profile.birthday) {
        const date = new Date(profile.birthday);
        console.log('Profile birthday loaded:', profile.birthday);
        console.log('As date object:', date);
        console.log('Local date parts:', {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate()
        });
      }
      setProfileData(profile);
    }
  }, [profile]);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleUpdateProfile = (data: Partial<ClientProfile>) => {
    console.log('handleUpdateProfile received:', data);
    if (data.birthday) {
      console.log('Birthday update received:', data.birthday);
      console.log('As date object:', new Date(data.birthday));
    }
    
    setProfileData(prev => {
      const merged = { 
        ...prev, 
        ...data,
        favorite_movements: Array.isArray(data.favorite_movements) ? data.favorite_movements : prev.favorite_movements || []
      };
      console.log('Updated profile data:', merged);
      return merged;
    });
  };

  const handleComplete = () => {
    const finalData = {
      ...profileData,
      favorite_movements: Array.isArray(profileData.favorite_movements) ? profileData.favorite_movements : []
    };
    
    console.log('Submitting final profile data:', finalData);
    if (finalData.birthday) {
      console.log('Final birthday to be saved:', finalData.birthday);
    }
    
    updateProfileMutation.mutate(finalData);
  };

  const handleReturnToSettings = () => {
    navigate('/client-dashboard/settings');
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-client" />
        <span className="ml-2 text-client">Redirecting to settings...</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-client" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="relative">
        <div className="fixed left-4 top-4 z-50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReturnToSettings}
                  className="flex items-center gap-1 bg-white shadow-md border border-gray-200 rounded-full px-3 py-1 text-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Settings
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Return to settings page</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <ProfileBuilderLayout step={currentStep} totalSteps={TOTAL_STEPS} title="Edit Your Profile">
          {currentStep === 1 && (
            <ProfileBuilderStepOne
              profile={profileData}
              onUpdate={handleUpdateProfile}
              onNext={handleNext}
            />
          )}

          {currentStep === 2 && (
            <ProfileBuilderStepTwo
              profile={profileData}
              onUpdate={handleUpdateProfile}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <ProfileBuilderStepThree
              profile={profileData}
              onUpdate={handleUpdateProfile}
              onComplete={handleComplete}
              onBack={handleBack}
            />
          )}
        </ProfileBuilderLayout>
      </div>
    </PageTransition>
  );
};

export default ProfileEditor;
