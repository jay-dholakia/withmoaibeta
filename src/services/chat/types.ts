// Chat room types

export interface ChatRoom {
  id: string;
  name: string;
  is_group_chat: boolean;
  created_at: string;
  is_buddy_chat?: boolean;
  accountability_pairing_id?: string;
  other_user_id?: string;
  other_user_name?: string;
  other_user_avatar?: string;
  buddy_ids?: string[];
  group_id?: string; // Add this field to store the group ID for group chats
  last_message?: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  room_id: string;
  is_direct_message?: boolean;
  sender_name?: string;
  sender_avatar?: string;
}

export interface ChatUserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  user_type?: string;
}

export interface ChatMember {
  id: string;
  name: string;
  avatar_url?: string;
  isActive?: boolean;
  isOnline?: boolean;
  isTyping?: boolean;
}
