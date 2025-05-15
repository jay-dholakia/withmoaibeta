
-- Function to get valid client IDs within specific groups that exist in auth.users
CREATE OR REPLACE FUNCTION public.get_valid_client_ids_for_chat(group_ids UUID[])
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  valid_users UUID[];
BEGIN
  -- Get client IDs that are in the specified groups and also exist in auth.users
  SELECT ARRAY_AGG(DISTINCT gm.user_id)
  INTO valid_users
  FROM group_members gm
  JOIN profiles p ON gm.user_id = p.id
  WHERE gm.group_id = ANY(group_ids)
  AND p.user_type = 'client'
  AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = gm.user_id);
  
  RETURN valid_users;
END;
$$;

-- Function to get all valid client IDs that exist in auth.users (for admins)
CREATE OR REPLACE FUNCTION public.get_all_valid_client_ids()
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  valid_users UUID[];
BEGIN
  -- Get all client IDs that exist in auth.users
  SELECT ARRAY_AGG(DISTINCT p.id)
  INTO valid_users
  FROM profiles p
  WHERE p.user_type = 'client'
  AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = p.id);
  
  RETURN valid_users;
END;
$$;

-- Update the create_or_get_direct_message_room function to validate users first
CREATE OR REPLACE FUNCTION public.create_or_get_direct_message_room(user1 UUID, user2 UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  dm_room_id UUID;
  new_room_id UUID;
BEGIN
  -- Validate that both users exist in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user1) THEN
    RAISE EXCEPTION 'User 1 does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user2) THEN
    RAISE EXCEPTION 'User 2 does not exist';
  END IF;

  -- Check if DM room already exists
  SELECT room_id INTO dm_room_id
  FROM public.direct_message_rooms
  WHERE (user1_id = user1 AND user2_id = user2) 
     OR (user1_id = user2 AND user2_id = user1);

  -- If room exists, return it
  IF dm_room_id IS NOT NULL THEN
    RETURN dm_room_id;
  END IF;
  
  -- Create new chat room
  INSERT INTO public.chat_rooms (name, is_group_chat)
  VALUES ('Direct Message', false)
  RETURNING id INTO new_room_id;
  
  -- Create direct message room link
  INSERT INTO public.direct_message_rooms (room_id, user1_id, user2_id)
  VALUES (new_room_id, user1, user2);
  
  RETURN new_room_id;
END;
$$;
