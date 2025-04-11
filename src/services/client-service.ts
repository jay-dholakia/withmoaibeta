
/**
 * Delete user
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('admin_delete_user', { user_id: userId });
    
    if (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
    
    // Return the boolean result directly from the RPC function
    return data === true;
  } catch (error) {
    console.error("Error in deleteUser:", error);
    throw error;
  }
};
