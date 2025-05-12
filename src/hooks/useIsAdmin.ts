
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useIsAdmin = () => {
  const { user, userType } = useAuth();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      console.log(`Checking admin status for user: ${user.id} with userType: ${userType}`);
      
      // First check if the user type from context is already admin
      if (userType === 'admin') {
        console.log(`User ${user.id} has admin userType, considering as admin`);
        return true;
      }
      
      // Fall back to the RPC function as a secondary check
      try {
        const { data, error } = await supabase
          .rpc('is_admin', { check_user_id: user.id });
        
        if (error) {
          console.error('Error checking admin status:', error);
          return false;
        }
        
        console.log(`Admin check result for ${user.id}:`, data);
        return !!data;
      } catch (error) {
        console.error('Exception during admin check:', error);
        return false;
      }
    },
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute
  });

  return {
    isAdmin: !!isAdmin,
    isLoading
  };
};
