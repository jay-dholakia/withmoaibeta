
export interface ChatRoom {
  id: string;
  name: string;
  is_group_chat: boolean;
  created_at: string;
  group_id?: string;
  other_user_id?: string;
  other_user_name?: string;
  other_user_avatar?: string | null;
  is_buddy_chat?: boolean;
  accountability_pairing_id?: string;
  buddy_ids?: string[];
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string | null;
  content: string;
  created_at: string;
}
