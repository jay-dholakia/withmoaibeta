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
      exercises: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
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
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          token: string
          user_type: string
        }
        Insert: {
          accepted?: boolean | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          token: string
          user_type: string
        }
        Update: {
          accepted?: boolean | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          token?: string
          user_type?: string
        }
        Relationships: []
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
      workout_completions: {
        Row: {
          completed_at: string
          id: string
          notes: string | null
          rating: number | null
          user_id: string
          workout_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          notes?: string | null
          rating?: number | null
          user_id: string
          workout_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          notes?: string | null
          rating?: number | null
          user_id?: string
          workout_id?: string
        }
        Relationships: [
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
          title: string
          week_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          description?: string | null
          id?: string
          title: string
          week_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          description?: string | null
          id?: string
          title?: string
          week_id?: string
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
      create_and_send_invitation: {
        Args: {
          p_email: string
          p_user_type: string
        }
        Returns: string
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
      is_coach_for_client: {
        Args: {
          coach_id: string
          client_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
