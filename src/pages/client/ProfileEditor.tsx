
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ClientProfile, fetchClientProfile, updateClientProfile } from '@/services/client-service';
import { ProfileBuilderLayout } from '@/components/client/ProfileBuilder/ProfileBuilderLayout';
import { ProfileBuilderStepOne } from '@/components/client/ProfileBuilder/ProfileBuilderStepOne';
import { ProfileBuilderStepTwo } from '@/components/client/ProfileBuilder/ProfileBuilderStepTwo';
import { ProfileBuilderStepThree } from '@/components/client/ProfileBuilder/ProfileBuilderStepThree';
import { Loader2 } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';

const TOTAL_STEPS = 3;

const ProfileEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<Partial<ClientProfile>>({});
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Fetch client profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['client-profile-edit', user?.id],
    queryFn: async () => {
      console.log('ProfileEditor: Fetching profile for user:', user?.id);
      if (!user?.id) throw new Error('User not authenticated');
      try {
        const result = await fetchClientProfile(user.id);
        console.log('ProfileEditor: Fetch result:', result);
        return result;
      } catch (error) {
        console.error('ProfileEditor: Error fetching profile:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: 3,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<ClientProfile>) => {
      if (!user?.id) throw new Error('User not authenticated');
      console.log('ProfileEditor: Updating profile with data:', data);
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

  // Initialize profileData from fetched profile
  useEffect(() => {
    if (profile) {
      console.log('Profile data loaded:', profile);
      setProfileData(profile);
    }
  }, [profile]);

  // Handle navigation between steps
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

  // Handle updates to profile data
  const handleUpdateProfile = (data: Partial<ClientProfile>) => {
    // Update local state only, don't update in database yet
    setProfileData(prev => {
      const merged = { ...prev, ...data };
      console.log('Updated profile data:', merged);
      return merged;
    });
    
    // Only update in database when user completes all steps
    // The actual update will be done in handleComplete
  };

  // Handle completion of the profile editing
  const handleComplete = () => {
    console.log('Submitting final profile data:', profileData);
    updateProfileMutation.mutate(profileData);
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
    </PageTransition>
  );
};

export default ProfileEditor;
