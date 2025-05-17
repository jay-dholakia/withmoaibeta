
import { supabase } from "@/integrations/supabase/client";
import { updateClientProfile } from './profile';

/**
 * Uploads a client avatar image
 */
export const uploadClientAvatar = async (userId: string, file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-avatar.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = data.publicUrl;

    await updateClientProfile(userId, { avatar_url: avatarUrl });

    return avatarUrl;
  } catch (error) {
    console.error('Error in uploadClientAvatar:', error);
    throw error;
  }
};
