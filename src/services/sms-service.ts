
import { supabase } from '@/integrations/supabase/client';

export const sendSMS = async (phoneNumber: string, message: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        to: phoneNumber,
        message
      }
    });

    if (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in sendSMS:', error);
    throw error;
  }
};
