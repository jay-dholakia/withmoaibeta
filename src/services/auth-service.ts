
/**
 * Auth service for handling authentication related operations
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Sends a password reset email
 */
export const sendPasswordResetEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error in sendPasswordResetEmail:", error);
    return false;
  }
};

/**
 * Deletes a user account
 */
export const deleteUser = async (userId: string) => {
  try {
    // This is a simplified implementation. In a real app, you would need admin privileges,
    // and would probably use a serverless function to handle this securely.
    
    // First delete any related records (profiles, etc)
    const { error: profileError } = await supabase
      .from('client_profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) {
      console.error("Error deleting client profile:", profileError);
      throw profileError;
    }
    
    // Then delete from auth.users (using the correct RPC function name)
    const { error: deleteError } = await supabase.rpc('admin_delete_user', {
      user_id: userId
    });
    
    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      throw deleteError;
    }
    
    return true;
  } catch (error) {
    console.error("Error in deleteUser:", error);
    return false;
  }
};
