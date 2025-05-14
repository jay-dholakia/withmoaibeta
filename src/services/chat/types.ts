
/**
 * Interface for a chat room
 */
export interface ChatRoom {
  id: string;
  name: string;
  is_group_chat: boolean;
  is_buddy_chat?: boolean;
  created_at: string;
  group_id?: string;
  other_user_id?: string;
  other_user_name?: string;
  other_user_profile_picture?: string | null;
  accountability_buddy_id?: string;
}

/**
 * Interface for a chat message
 */
export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name?: string;
  sender_profile_picture?: string | null;
  content: string;
  created_at: string;
}
