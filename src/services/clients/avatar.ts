
import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a client avatar image
 */
export const uploadClientAvatar = async (
  userId: string,
  file: File
): Promise<string> => {
  try {
    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('profile-images')
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    // Update the user's avatar_url in client_profiles
    const { error: updateError } = await supabase
      .from('client_profiles')
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating avatar URL in profile:', updateError);
      // Continue anyway, we'll still return the URL
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading client avatar:', error);
    throw error;
  }
};
