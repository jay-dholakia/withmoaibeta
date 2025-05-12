
import { QueryFunctionContext } from "@tanstack/react-query";

export interface FetchActivitiesOptions {
  limit?: number;
  offset?: number;
  retryCount?: number;
}

export interface ActivityUser {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export interface ActivityLike {
  id: string;
  user_id: string;
  activity_id: string;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  workout_id?: string;
  completed_at: string;
  notes?: string;
  rating?: number;
  rest_day?: boolean;
  life_happens_pass?: boolean;
  title?: string;
  description?: string;
  workout_type?: string;
  duration?: string;
  distance?: string;
  profiles?: ActivityUser;
  workout?: any;
  likes: ActivityLike[];
}
