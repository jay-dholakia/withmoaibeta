
import { RealtimeChannel } from "@supabase/supabase-js";

export type ChatMessage = {
  id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  content: string;
  created_at: string;
  room_id: string;
  is_direct_message: boolean;
};

export type ChatRoom = {
  id: string;
  name: string;
  is_group_chat: boolean;
  group_id?: string;
  other_user_id?: string;
  other_user_name?: string;
  other_user_avatar?: string;
  created_at: string;
};
