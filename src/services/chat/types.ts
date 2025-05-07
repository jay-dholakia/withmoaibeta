
export interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string | null;
  is_from_current_user?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  is_group_chat: boolean;
  is_buddy_chat?: boolean;
  created_at: string;
  group_id?: string;
  other_user_id?: string;
  other_user_name?: string;
  other_user_avatar?: string | null;
  buddy_ids?: string[];
  buddy_id_string?: string;
}

export interface MessagePayload {
  content: string;
  roomId: string;
  senderId: string;
}
