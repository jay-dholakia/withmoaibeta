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

const ProfileBuilder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<Partial<ClientProfile>>({});
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [attemptedFetch, setAttemptedFetch] = useState(false);

  console.log('ProfileBuilder: Rendering with user ID:', user?.id);

  // Fetch client profile with error handling
  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['client-profile', user?.id],
    queryFn: async () => {
      console.log('ProfileBuilder: Fetching profile for user:', user?.id);
      if (!user?.id) throw new Error('User not authenticated');
      try {
        setAttemptedFetch(true);
        const result = await fetchClientProfile(user.id);
        console.log('ProfileBuilder: Fetch result:', result);
        return result;
      } catch (error) {
        console.error('ProfileBuilder: Error fetching profile:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000, // 30 seconds
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<ClientProfile>) => {
      if (!user?.id) throw new Error('User not authenticated');
      console.log('ProfileBuilder: Updating profile with data:', data);
      return updateClientProfile(user.id, data);
    },
    onSuccess: (updatedProfile) => {
      console.log('Profile updated:', updatedProfile);
      // If profile is now complete, redirect to client dashboard
      if (updatedProfile.profile_completed) {
        toast.success('Your profile has been completed!');
        setIsRedirecting(true);
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
      console.log('Profile data loaded:', profile);
      setProfileData(profile);
      
      // If profile is already completed, redirect to dashboard
      if (profile.profile_completed) {
        console.log('Profile is complete, redirecting to dashboard');
        setIsRedirecting(true);
        setTimeout(() => navigate('/client-dashboard'), 300);
      }
    }
  }, [profile, navigate]);

  // Handle error cases by retrying or using fallback profile
  useEffect(() => {
    if (error && attemptedFetch) {
      console.log('Error detected, using fallback profile');
      
      // Create a fallback empty profile
      if (!profileData || Object.keys(profileData).length === 0) {
        setProfileData({
          id: user?.id,
          first_name: null,
          last_name: null,
          city: null,
          state: null,
          fitness_goals: [],
          favorite_movements: [],
          profile_completed: false
        });
      }
      
      // Try to refetch after a delay
      const timer = setTimeout(() => {
        if (user?.id) {
          console.log('Retrying profile fetch...');
          refetch();
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [error, attemptedFetch, profileData, user?.id, refetch]);

  // Debug log for profile status
  useEffect(() => {
    if (!isLoading) {
      console.log('Profile builder loaded with profile:', profile);
      if (!profile) {
        console.log('No profile found, creating empty profile');
      }
    }
  }, [isLoading, profile]);

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

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-client" />
        <span className="ml-2 text-client">Redirecting to dashboard...</span>
      </div>
    );
  }

  if (isLoading && !profileData.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-client" />
      </div>
    );
  }

  return (
    <PageTransition>
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
    </PageTransition>
  );
};

export default ProfileBuilder;
