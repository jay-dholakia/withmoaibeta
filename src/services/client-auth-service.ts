import { supabase } from '@/integrations/supabase/client';

/**
 * Delete a user via Supabase Edge function
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: userId },
    });
    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return false;
  }
};

/**
 * Send a password reset email via Supabase Auth
 */
export const sendPasswordResetEmail = async (
  email: string
): Promise<boolean> => {
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
    console.error('Error in sendPasswordResetEmail:', error);
    return false;
  }
};
