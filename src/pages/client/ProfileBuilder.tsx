
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

const TOTAL_STEPS = 3;

const ProfileBuilder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<Partial<ClientProfile>>({});

  // Fetch client profile
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['client-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchClientProfile(user.id);
    },
    enabled: !!user?.id,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<ClientProfile>) => {
      if (!user?.id) throw new Error('User not authenticated');
      return updateClientProfile(user.id, data);
    },
    onSuccess: (updatedProfile) => {
      console.log('Profile updated:', updatedProfile);
      // If profile is now complete, redirect to client dashboard
      if (updatedProfile.profile_completed) {
        toast.success('Your profile has been completed!');
        setTimeout(() => navigate('/client-dashboard'), 500);
      }
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('There was an error updating your profile');
    },
  });

  // Initialize profileData from fetched profile
  useEffect(() => {
    if (profile) {
      setProfileData(profile);
      
      // If profile is already completed, redirect to dashboard
      if (profile.profile_completed) {
        navigate('/client-dashboard');
      }
    }
  }, [profile, navigate]);

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
    setProfileData(prev => ({ ...prev, ...data }));
    updateProfileMutation.mutate(data);
  };

  // Handle completion of the profile setup
  const handleComplete = () => {
    const finalData = {
      ...profileData,
      profile_completed: true
    };
    
    updateProfileMutation.mutate(finalData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-client" />
      </div>
    );
  }

  if (error) {
    // Redirect to login if there's an error (likely auth issue)
    navigate('/client');
    return null;
  }

  return (
    <ProfileBuilderLayout step={currentStep} totalSteps={TOTAL_STEPS}>
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
  );
};

export default ProfileBuilder;
