
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getRemainingPasses } from '@/services/life-happens-service';
import { Umbrella } from 'lucide-react';

const PassCounter = () => {
  const { user } = useAuth();
  
  const { data: remainingPasses, isLoading } = useQuery({
    queryKey: ['life-happens-passes', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      return await getRemainingPasses(user.id);
    },
    enabled: !!user?.id,
  });
  
  if (isLoading || typeof remainingPasses === 'undefined') {
    return null;
  }
  
  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      <Umbrella className="h-4 w-4 text-blue-600" />
    </div>
  );
};

export default PassCounter;
