
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProgramType } from '@/services/group-service';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export const useProgramType = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const {
    data: programTypeData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-program-type', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return { success: false, programType: 'strength', multipleGroups: false };
      return await getUserProgramType(targetUserId);
    },
    enabled: !!targetUserId,
  });

  useEffect(() => {
    if (programTypeData?.multipleGroups) {
      toast.error(
        'You are a member of multiple groups with different program types. Please contact your coach to resolve this issue.',
        { duration: 6000 }
      );
    }

    if (error) {
      console.error('Error fetching program type:', error);
      toast.error('Failed to determine your program type');
    }
  }, [programTypeData, error]);

  // Default to 'strength' if we don't have a valid program type
  const programType = programTypeData?.success ? programTypeData.programType : 'strength';

  return {
    programType,
    isLoading,
    error,
    refetch,
    multipleGroupsError: programTypeData?.multipleGroups || false
  };
};
