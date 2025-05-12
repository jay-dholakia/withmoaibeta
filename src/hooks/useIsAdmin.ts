
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useIsAdmin = () => {
  const { user } = useAuth();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      console.log(`Checking admin status for user: ${user.id}`);
      
      // Use the is_admin server function to check admin status
      const { data, error } = await supabase
        .rpc('is_admin', { check_user_id: user.id });
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      console.log(`Admin check result for ${user.id}:`, data);
      return !!data;
    },
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute
  });

  return {
    isAdmin: !!isAdmin,
    isLoading
  };
};
