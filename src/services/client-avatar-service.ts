import { supabase } from '@/integrations/supabase/client';
import { updateClientProfile } from './client-profile-service';

/** Upload and update client avatar URL */
export const uploadClientAvatar = async (
  userId: string,
  file: File
): Promise<string | null> => {
  try {
    const ext = file.name.split('.').pop();
    const name = `${userId}-avatar.${ext}`;
    const path = `avatars/${name}`;

    const { error: uploadError } = await supabase.storage
      .from('user-content')
      .upload(path, file, { upsert: true });
    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('user-content').getPublicUrl(path);
    await updateClientProfile(userId, { avatar_url: data.publicUrl });
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadClientAvatar:', error);
    return null;
  }
};
