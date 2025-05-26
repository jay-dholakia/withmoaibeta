
import { supabase } from "@/integrations/supabase/client";

/**
 * Delete a user account (admin only)
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('admin_delete_user', { user_id: userId });

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};
