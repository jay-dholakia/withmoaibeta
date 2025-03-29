export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      client_custom_workout_exercises: {
        Row: {
          created_at: string
          custom_exercise_name: string | null
          exercise_id: string | null
          id: string
          notes: string | null
          order_index: number
          reps: string | null
          rest_seconds: number | null
          sets: number | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          custom_exercise_name?: string | null
          exercise_id?: string | null
          id?: string
          notes?: string | null
          order_index: number
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          workout_id: string
        }
        Update: {
          created_at?: string
          custom_exercise_name?: string | null
          exercise_id?: string | null
          id?: string
          notes?: string | null
          order_index?: number
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_custom_workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_custom_workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "client_custom_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_custom_workouts: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          title: string
          updated_at: string
          user_id: string
          workout_type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
          workout_type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
          workout_type?: string | null
        }
        Relationships: []
      }
      client_notes: {
        Row: {
          content: string
          created_at: string | null
          entry_date: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          entry_date?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          entry_date?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      client_profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          city: string | null
          created_at: string | null
          event_date: string | null
          event_name: string | null
          event_type: string | null
          favorite_movements: string[] | null
          first_name: string | null
          fitness_goals: string[] | null
          height: string | null
          id: string
          last_name: string | null
          profile_completed: boolean | null
          state: string | null
          updated_at: string | null
          weight: string | null
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          city?: string | null
          created_at?: string | null
          event_date?: string | null
          event_name?: string | null
          event_type?: string | null
          favorite_movements?: string[] | null
          first_name?: string | null
          fitness_goals?: string[] | null
          height?: string | null
          id: string
          last_name?: string | null
          profile_completed?: boolean | null
          state?: string | null
          updated_at?: string | null
          weight?: string | null
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          city?: string | null
          created_at?: string | null
          event_date?: string | null
          event_name?: string | null
          event_type?: string | null
          favorite_movements?: string[] | null
          first_name?: string | null
          fitness_goals?: string[] | null
          height?: string | null
          id?: string
          last_name?: string | null
          profile_completed?: boolean | null
          state?: string | null
          updated_at?: string | null
          weight?: string | null
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          id: string
          message: string
          read_by_client: boolean
          updated_at: string
          week_of: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          id?: string
          message: string
          read_by_client?: boolean
          updated_at?: string
          week_of: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          message?: string
          read_by_client?: boolean
          updated_at?: string
          week_of?: string
        }
        Relationships: []
      }
      coach_notes: {
        Row: {
          coach_id: string
          created_at: string | null
          group_id: string
          id: string
          member_id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          group_id: string
          id?: string
          member_id: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          group_id?: string
          id?: string
          member_id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coach_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          favorite_movements: string[] | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          favorite_movements?: string[] | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          favorite_movements?: string[] | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          category: string
          created_at: string
          description: string | null
          exercise_type: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          exercise_type?: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          exercise_type?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      exercises_backup: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          exercise_type: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          exercise_type?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          exercise_type?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      exercises_backup_safe: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          exercise_type: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          exercise_type?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          exercise_type?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      group_coaches: {
        Row: {
          coach_id: string
          created_at: string
          group_id: string
          id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          group_id: string
          id?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          group_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_coaches_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted: boolean | null
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          is_share_link: boolean | null
          share_link_type: string | null
          token: string
          user_type: string
        }
        Insert: {
          accepted?: boolean | null
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          is_share_link?: boolean | null
          share_link_type?: string | null
          token: string
          user_type: string
        }
        Update: {
          accepted?: boolean | null
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          is_share_link?: boolean | null
          share_link_type?: string | null
          token?: string
          user_type?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          achieved_at: string
          exercise_id: string
          id: string
          reps: number
          user_id: string
          weight: number
          workout_completion_id: string | null
        }
        Insert: {
          achieved_at?: string
          exercise_id: string
          id?: string
          reps: number
          user_id: string
          weight: number
          workout_completion_id?: string | null
        }
        Update: {
          achieved_at?: string
          exercise_id?: string
          id?: string
          reps?: number
          user_id?: string
          weight?: number
          workout_completion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_workout_completion_id_fkey"
            columns: ["workout_completion_id"]
            isOneToOne: false
            referencedRelation: "workout_completions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          user_type: string
        }
        Insert: {
          created_at?: string
          id: string
          user_type: string
        }
        Update: {
          created_at?: string
          id?: string
          user_type?: string
        }
        Relationships: []
      }
      program_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          end_date: string | null
          id: string
          program_id: string
          start_date: string
          user_id: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          end_date?: string | null
          id?: string
          program_id: string
          start_date: string
          user_id: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          end_date?: string | null
          id?: string
          program_id?: string
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_assignments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "workout_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      standalone_workout_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          reps: string | null
          rest_seconds: number | null
          sets: number | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          order_index: number
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "standalone_workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standalone_workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "standalone_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      standalone_workouts: {
        Row: {
          category: string | null
          coach_id: string
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
          workout_type: string | null
        }
        Insert: {
          category?: string | null
          coach_id: string
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          workout_type?: string | null
        }
        Update: {
          category?: string | null
          coach_id?: string
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          workout_type?: string | null
        }
        Relationships: []
      }
      workout_completions: {
        Row: {
          completed_at: string | null
          distance: string | null
          duration: string | null
          id: string
          life_happens_pass: boolean | null
          location: string | null
          notes: string | null
          rating: number | null
          rest_day: boolean | null
          standalone_workout_id: string | null
          user_id: string
          workout_id: string | null
        }
        Insert: {
          completed_at?: string | null
          distance?: string | null
          duration?: string | null
          id?: string
          life_happens_pass?: boolean | null
          location?: string | null
          notes?: string | null
          rating?: number | null
          rest_day?: boolean | null
          standalone_workout_id?: string | null
          user_id: string
          workout_id?: string | null
        }
        Update: {
          completed_at?: string | null
          distance?: string | null
          duration?: string | null
          id?: string
          life_happens_pass?: boolean | null
          location?: string | null
          notes?: string | null
          rating?: number | null
          rest_day?: boolean | null
          standalone_workout_id?: string | null
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_completions_standalone_workout_id_fkey"
            columns: ["standalone_workout_id"]
            isOneToOne: false
            referencedRelation: "standalone_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_completions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          reps: string
          rest_seconds: number | null
          sets: number
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          order_index: number
          reps: string
          rest_seconds?: number | null
          sets: number
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          reps?: string
          rest_seconds?: number | null
          sets?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_programs: {
        Row: {
          coach_id: string
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
          weeks: number
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          weeks: number
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          weeks?: number
        }
        Relationships: []
      }
      workout_set_completions: {
        Row: {
          completed: boolean
          created_at: string
          distance: string | null
          duration: string | null
          id: string
          location: string | null
          notes: string | null
          reps_completed: number | null
          set_number: number
          user_id: string | null
          weight: number | null
          workout_completion_id: string
          workout_exercise_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          distance?: string | null
          duration?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          reps_completed?: number | null
          set_number: number
          user_id?: string | null
          weight?: number | null
          workout_completion_id: string
          workout_exercise_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          distance?: string | null
          duration?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          reps_completed?: number | null
          set_number?: number
          user_id?: string | null
          weight?: number | null
          workout_completion_id?: string
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_set_completions_workout_completion_id_fkey"
            columns: ["workout_completion_id"]
            isOneToOne: false
            referencedRelation: "workout_completions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_set_completions_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_weeks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          program_id: string
          title: string
          week_number: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          program_id: string
          title: string
          week_number: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          program_id?: string
          title?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_weeks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "workout_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          day_of_week: number
          description: string | null
          id: string
          priority: number | null
          title: string
          week_id: string
          workout_type: Database["public"]["Enums"]["workout_type"] | null
        }
        Insert: {
          created_at?: string
          day_of_week: number
          description?: string | null
          id?: string
          priority?: number | null
          title: string
          week_id: string
          workout_type?: Database["public"]["Enums"]["workout_type"] | null
        }
        Update: {
          created_at?: string
          day_of_week?: number
          description?: string | null
          id?: string
          priority?: number | null
          title?: string
          week_id?: string
          workout_type?: Database["public"]["Enums"]["workout_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "workout_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      client_workout_info: {
        Row: {
          current_program_id: string | null
          last_workout_at: string | null
          total_workouts_completed: number | null
          user_id: string | null
          user_type: string | null
        }
        Insert: {
          current_program_id?: never
          last_workout_at?: never
          total_workouts_completed?: never
          user_id?: string | null
          user_type?: string | null
        }
        Update: {
          current_program_id?: never
          last_workout_at?: never
          total_workouts_completed?: never
          user_id?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      count_workouts_for_user_and_week: {
        Args: {
          user_id_param: string
          week_number_param: number
        }
        Returns: number
      }
      create_and_send_invitation: {
        Args: {
          p_email: string
          p_user_type: string
        }
        Returns: string
      }
      create_client_profiles_table: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_client_workout_info: {
        Args: {
          user_id_param: string
        }
        Returns: {
          user_id: string
          user_type: string
          current_program_id: string
          last_workout_at: string
          total_workouts_completed: number
        }[]
      }
      get_coach_clients: {
        Args: {
          coach_id: string
        }
        Returns: {
          id: string
          email: string
          user_type: string
          last_workout_at: string
          total_workouts_completed: number
          current_program_id: string
          current_program_title: string
          days_since_last_workout: number
          group_ids: string[]
        }[]
      }
      get_group_monthly_leaderboard: {
        Args: {
          group_id: string
          start_date: string
        }
        Returns: {
          user_id: string
          email: string
          total_workouts: number
        }[]
      }
      get_group_weekly_leaderboard: {
        Args: {
          group_id: string
          start_date: string
        }
        Returns: {
          user_id: string
          email: string
          total_workouts: number
        }[]
      }
      get_latest_coach_message: {
        Args: {
          client_id_param: string
        }
        Returns: {
          id: string
          coach_id: string
          client_id: string
          message: string
          created_at: string
          updated_at: string
          week_of: string
          read_by_client: boolean
          coach_first_name: string
        }[]
      }
      get_users_email: {
        Args: {
          user_ids: string[]
        }
        Returns: {
          id: string
          email: string
        }[]
      }
      is_coach_for_client: {
        Args: {
          coach_id: string
          client_id: string
        }
        Returns: boolean
      }
      is_program_assigned_to_user: {
        Args: {
          program_id_param: string
          user_id_param: string
        }
        Returns: boolean
      }
      update_client_program: {
        Args: {
          user_id_param: string
          program_id_param: string
        }
        Returns: undefined
      }
    }
    Enums: {
      workout_type: "cardio" | "strength" | "mobility" | "flexibility"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
