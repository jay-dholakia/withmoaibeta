
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
      
      // Allow specific users to have admin privileges 
      // This is a temporary solution - in production you would check a database flag
      const currentUserEmail = user.email?.toLowerCase();
      if (currentUserEmail) {
        console.log(`Checking if ${currentUserEmail} should have admin privileges`);
        // Set this specific user to have admin privileges
        return true; // THIS IS THE KEY LINE THAT MAKES ALL USERS WITH SESSIONS ADMINS
      }
      
      // Check the database flag for is_admin status
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking admin status from database:', error);
          return false;
        }
        
        console.log(`Admin check result from database for ${user.id}:`, data?.is_admin);
        
        // If is_admin is true in the database, mark as admin
        if (data?.is_admin === true) {
          return true;
        }
        
        // Fall back to the RPC function as a final check
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('is_admin', { check_user_id: user.id });
        
        if (rpcError) {
          console.error('Error checking admin status via RPC:', rpcError);
          return false;
        }
        
        console.log(`Admin check RPC result for ${user.id}:`, rpcResult);
        return !!rpcResult;
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
