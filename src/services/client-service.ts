
export const createClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existingProfile) {
    return {
      ...existingProfile,
      user_type: 'client',
      vacation_mode: existingProfile.vacation_mode ?? false // Ensure vacation_mode is always set
    };
  }

  // Create new profile with default vacation_mode
  const { data, error } = await supabase
    .from('client_profiles')
    .insert({ 
      id: userId, 
      vacation_mode: false // Explicitly set default to false
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating client profile:', error);
    return null;
  }

  return {
    ...data,
    user_type: 'client',
    vacation_mode: false
  };
};
