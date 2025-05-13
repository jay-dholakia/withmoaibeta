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
      accountability_buddies: {
        Row: {
          buddy_pairing_id: string | null
          created_at: string
          group_id: string
          id: string
          updated_at: string
          user_id_1: string
          user_id_2: string
          user_id_3: string | null
          week_start: string
        }
        Insert: {
          buddy_pairing_id?: string | null
          created_at?: string
          group_id: string
          id?: string
          updated_at?: string
          user_id_1: string
          user_id_2: string
          user_id_3?: string | null
          week_start: string
        }
        Update: {
          buddy_pairing_id?: string | null
          created_at?: string
          group_id?: string
          id?: string
          updated_at?: string
          user_id_1?: string
          user_id_2?: string
          user_id_3?: string | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "accountability_buddies_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_comments: {
        Row: {
          activity_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_comments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "workout_completions"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_likes: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_likes_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "workout_completions"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_feedback: {
        Row: {
          created_at: string
          feedback: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cardio_logs: {
        Row: {
          activity_type: string
          client_id: string
          created_at: string
          duration: number
          id: string
          log_date: string
          notes: string | null
          program_week_id: string | null
        }
        Insert: {
          activity_type: string
          client_id: string
          created_at?: string
          duration: number
          id?: string
          log_date?: string
          notes?: string | null
          program_week_id?: string | null
        }
        Update: {
          activity_type?: string
          client_id?: string
          created_at?: string
          duration?: number
          id?: string
          log_date?: string
          notes?: string | null
          program_week_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cardio_logs_program_week_id_fkey"
            columns: ["program_week_id"]
            isOneToOne: false
            referencedRelation: "program_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_direct_message: boolean
          room_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_direct_message?: boolean
          room_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_direct_message?: boolean
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          accountability_pairing_id: string | null
          created_at: string | null
          group_id: string | null
          id: string
          is_buddy_chat: boolean | null
          is_group_chat: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          accountability_pairing_id?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_buddy_chat?: boolean | null
          is_group_chat?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          accountability_pairing_id?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_buddy_chat?: boolean | null
          is_group_chat?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_accountability_pairing_id_fkey"
            columns: ["accountability_pairing_id"]
            isOneToOne: false
            referencedRelation: "accountability_buddies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
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
            foreignKeyName: "client_custom_workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises_with_alternatives"
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
          workout_date: string | null
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
          workout_date?: string | null
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
          workout_date?: string | null
          workout_type?: string | null
        }
        Relationships: []
      }
      client_notes: {
        Row: {
          content: string
          created_at: string | null
          emoji: string | null
          entry_date: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          emoji?: string | null
          entry_date?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          emoji?: string | null
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
          program_type: string | null
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
          program_type?: string | null
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
          program_type?: string | null
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
      coach_resources: {
        Row: {
          coach_id: string
          created_at: string
          description: string | null
          id: string
          resource_type: string
          tags: string[] | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          id?: string
          resource_type?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          id?: string
          resource_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      direct_message_rooms: {
        Row: {
          created_at: string | null
          id: string
          room_id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          room_id: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          room_id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_message_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string
          created_at: string
          description: string | null
          exercise_type: string
          id: string
          log_type: string | null
          muscle_group: string | null
          name: string
          youtube_link: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          exercise_type?: string
          id?: string
          log_type?: string | null
          muscle_group?: string | null
          name: string
          youtube_link?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          exercise_type?: string
          id?: string
          log_type?: string | null
          muscle_group?: string | null
          name?: string
          youtube_link?: string | null
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
      fire_badges: {
        Row: {
          created_at: string
          id: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          created_at: string
          expiry_date: number
          id: string
          refresh_token: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expiry_date: number
          id?: string
          refresh_token: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expiry_date?: number
          id?: string
          refresh_token?: string
          user_id?: string
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
            foreignKeyName: "fk_group_members_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
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
          program_type: string | null
          spotify_playlist_url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          program_type?: string | null
          spotify_playlist_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          program_type?: string | null
          spotify_playlist_url?: string | null
        }
        Relationships: []
      }
      invitation_usage: {
        Row: {
          id: string
          invitation_id: string | null
          used_at: string
          user_email: string
        }
        Insert: {
          id?: string
          invitation_id?: string | null
          used_at?: string
          user_email: string
        }
        Update: {
          id?: string
          invitation_id?: string | null
          used_at?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_usage_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_usage_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "type_refresh_helper"
            referencedColumns: ["invitation_id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted: boolean | null
          accepted_at: string | null
          created_at: string
          email: string | null
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
          email?: string | null
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
          email?: string | null
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
      nutrition_ai_logs: {
        Row: {
          answer: string
          created_at: string | null
          error: string | null
          id: string
          question: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          error?: string | null
          id?: string
          question: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          error?: string | null
          id?: string
          question?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          achieved_at: string
          exercise_id: string
          id: string
          reps: number | null
          user_id: string
          weight: number
          workout_completion_id: string | null
        }
        Insert: {
          achieved_at?: string
          exercise_id: string
          id?: string
          reps?: number | null
          user_id: string
          weight: number
          workout_completion_id?: string | null
        }
        Update: {
          achieved_at?: string
          exercise_id?: string
          id?: string
          reps?: number | null
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
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises_with_alternatives"
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
          is_admin: boolean | null
          user_type: string
        }
        Insert: {
          created_at?: string
          id: string
          is_admin?: boolean | null
          user_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
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
      program_week_goals: {
        Row: {
          cardio_minutes_goal: number | null
          created_at: string | null
          exercises_goal: number | null
          id: string
          miles_goal: number | null
          program_id: string
          week_number: number
        }
        Insert: {
          cardio_minutes_goal?: number | null
          created_at?: string | null
          exercises_goal?: number | null
          id?: string
          miles_goal?: number | null
          program_id: string
          week_number: number
        }
        Update: {
          cardio_minutes_goal?: number | null
          created_at?: string | null
          exercises_goal?: number | null
          id?: string
          miles_goal?: number | null
          program_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_week_goals_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "workout_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_weeks: {
        Row: {
          created_at: string | null
          id: string
          program_id: string
          target_cardio_minutes: number | null
          target_miles_run: number | null
          target_strength_mobility_workouts: number | null
          target_strength_workouts: number | null
          updated_at: string | null
          week_number: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          program_id: string
          target_cardio_minutes?: number | null
          target_miles_run?: number | null
          target_strength_mobility_workouts?: number | null
          target_strength_workouts?: number | null
          updated_at?: string | null
          week_number: number
        }
        Update: {
          created_at?: string | null
          id?: string
          program_id?: string
          target_cardio_minutes?: number | null
          target_miles_run?: number | null
          target_strength_mobility_workouts?: number | null
          target_strength_workouts?: number | null
          updated_at?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_program"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          coach_id: string
          created_at: string | null
          id: string
          name: string
          program_type: Database["public"]["Enums"]["program_type"]
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          id?: string
          name: string
          program_type: Database["public"]["Enums"]["program_type"]
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          id?: string
          name?: string
          program_type?: Database["public"]["Enums"]["program_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      run_tracking: {
        Row: {
          created_at: string
          id: string
          latitude: number
          longitude: number
          run_id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          run_id: string
          timestamp?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          run_id?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      standalone_superset_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string | null
          workout_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_standalone_superset_groups_workout"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "standalone_workouts"
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
          superset_group_id: string | null
          superset_order: number | null
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
          superset_group_id?: string | null
          superset_order?: number | null
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
          superset_group_id?: string | null
          superset_order?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_standalone_workout_exercises_superset_group"
            columns: ["superset_group_id"]
            isOneToOne: false
            referencedRelation: "standalone_superset_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standalone_workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standalone_workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises_with_alternatives"
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
          order_index: number | null
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
          order_index?: number | null
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
          order_index?: number | null
          title?: string
          updated_at?: string
          workout_type?: string | null
        }
        Relationships: []
      }
      workout_completion_exercises: {
        Row: {
          completed: boolean | null
          created_at: string | null
          exercise_id: string
          id: string
          result: Json | null
          workout_completion_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          exercise_id: string
          id?: string
          result?: Json | null
          workout_completion_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          exercise_id?: string
          id?: string
          result?: Json | null
          workout_completion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_exercise"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_exercise"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises_with_alternatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_workout_completion"
            columns: ["workout_completion_id"]
            isOneToOne: false
            referencedRelation: "workout_completions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_completion_exercises_workout_completion_id_fkey"
            columns: ["workout_completion_id"]
            isOneToOne: false
            referencedRelation: "workout_completions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_completions: {
        Row: {
          completed_at: string | null
          custom_workout_id: string | null
          description: string | null
          distance: string | null
          duration: string | null
          id: string
          life_happens_pass: boolean | null
          location: string | null
          notes: string | null
          rating: number | null
          rest_day: boolean | null
          standalone_workout_id: string | null
          started_at: string | null
          title: string | null
          user_id: string
          workout_id: string | null
          workout_type: string | null
        }
        Insert: {
          completed_at?: string | null
          custom_workout_id?: string | null
          description?: string | null
          distance?: string | null
          duration?: string | null
          id?: string
          life_happens_pass?: boolean | null
          location?: string | null
          notes?: string | null
          rating?: number | null
          rest_day?: boolean | null
          standalone_workout_id?: string | null
          started_at?: string | null
          title?: string | null
          user_id: string
          workout_id?: string | null
          workout_type?: string | null
        }
        Update: {
          completed_at?: string | null
          custom_workout_id?: string | null
          description?: string | null
          distance?: string | null
          duration?: string | null
          id?: string
          life_happens_pass?: boolean | null
          location?: string | null
          notes?: string | null
          rating?: number | null
          rest_day?: boolean | null
          standalone_workout_id?: string | null
          started_at?: string | null
          title?: string | null
          user_id?: string
          workout_id?: string | null
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_completions_custom_workout_id_fkey"
            columns: ["custom_workout_id"]
            isOneToOne: false
            referencedRelation: "client_custom_workouts"
            referencedColumns: ["id"]
          },
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
      workout_drafts: {
        Row: {
          created_at: string
          draft_data: Json
          id: string
          updated_at: string
          user_id: string
          workout_id: string | null
          workout_type: string | null
        }
        Insert: {
          created_at?: string
          draft_data: Json
          id?: string
          updated_at?: string
          user_id: string
          workout_id?: string | null
          workout_type?: string | null
        }
        Update: {
          created_at?: string
          draft_data?: Json
          id?: string
          updated_at?: string
          user_id?: string
          workout_id?: string | null
          workout_type?: string | null
        }
        Relationships: []
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
          superset_group_id: string | null
          superset_order: number | null
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
          superset_group_id?: string | null
          superset_order?: number | null
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
          superset_group_id?: string | null
          superset_order?: number | null
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
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises_with_alternatives"
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
          program_type: string
          title: string
          updated_at: string
          weeks: number
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          id?: string
          program_type?: string
          title: string
          updated_at?: string
          weeks: number
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          id?: string
          program_type?: string
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
          target_cardio_minutes: number | null
          target_miles_run: number | null
          target_strength_mobility_workouts: number | null
          target_strength_workouts: number | null
          title: string
          updated_at: string | null
          week_number: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          program_id: string
          target_cardio_minutes?: number | null
          target_miles_run?: number | null
          target_strength_mobility_workouts?: number | null
          target_strength_workouts?: number | null
          title: string
          updated_at?: string | null
          week_number: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          program_id?: string
          target_cardio_minutes?: number | null
          target_miles_run?: number | null
          target_strength_mobility_workouts?: number | null
          target_strength_workouts?: number | null
          title?: string
          updated_at?: string | null
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
          template_id: string | null
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
          template_id?: string | null
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
          template_id?: string | null
          title?: string
          week_id?: string
          workout_type?: Database["public"]["Enums"]["workout_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "standalone_workouts"
            referencedColumns: ["id"]
          },
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
      exercises_with_alternatives: {
        Row: {
          category: string | null
          description: string | null
          exercise_type: string | null
          id: string | null
          muscle_group: string | null
          name: string | null
          youtube_link: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          exercise_type?: string | null
          id?: string | null
          muscle_group?: string | null
          name?: string | null
          youtube_link?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          exercise_type?: string | null
          id?: string | null
          muscle_group?: string | null
          name?: string | null
          youtube_link?: string | null
        }
        Relationships: []
      }
      type_refresh_helper: {
        Row: {
          invitation_id: string | null
          share_link_type: string | null
          usage_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_delete_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      award_fire_badge: {
        Args: { award_user_id: string; award_week_start: string }
        Returns: string
      }
      check_user_weekly_completion: {
        Args: { check_user_id: string; week_start_date: string }
        Returns: boolean
      }
      count_user_fire_badges: {
        Args: { user_id_param: string }
        Returns: number
      }
      count_workouts_for_user_and_week: {
        Args: { user_id_param: string; week_number_param: number }
        Returns: number
      }
      create_and_send_invitation: {
        Args: { p_email: string; p_user_type: string }
        Returns: string
      }
      create_client_profiles_table: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_or_get_direct_message_room: {
        Args: { user1: string; user2: string }
        Returns: string
      }
      get_client_workout_info: {
        Args: { user_id_param: string }
        Returns: {
          user_id: string
          user_type: string
          current_program_id: string
          last_workout_at: string
          total_workouts_completed: number
        }[]
      }
      get_coach_clients: {
        Args: { coach_id: string }
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
      get_exercise_alternatives: {
        Args: { exercise_id_param: string }
        Returns: {
          alternative_id: string
          alternative_name: string
          alternative_type: string
        }[]
      }
      get_exercises_by_muscle_group: {
        Args: { muscle_group_param: string }
        Returns: {
          id: string
          name: string
          category: string
          description: string
          exercise_type: string
          youtube_link: string
          muscle_group: string
        }[]
      }
      get_group_monthly_leaderboard: {
        Args: { group_id: string; start_date: string }
        Returns: {
          user_id: string
          email: string
          total_workouts: number
        }[]
      }
      get_group_weekly_leaderboard: {
        Args: { group_id: string; start_date: string }
        Returns: {
          user_id: string
          email: string
          total_workouts: number
        }[]
      }
      get_latest_coach_message: {
        Args: { client_id_param: string }
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
      get_pacific_week_start: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_users_email: {
        Args: { user_ids: string[] }
        Returns: {
          id: string
          email: string
        }[]
      }
      get_weekly_run_progress: {
        Args: { user_id_param: string; start_date?: string }
        Returns: {
          miles_completed: number
          exercises_completed: number
          cardio_minutes_completed: number
        }[]
      }
      is_admin: {
        Args: { check_user_id?: string }
        Returns: boolean
      }
      is_coach_for_client: {
        Args: { coach_id: string; client_id: string }
        Returns: boolean
      }
      is_program_assigned_to_user: {
        Args: { program_id_param: string; user_id_param: string }
        Returns: boolean
      }
      should_assign_buddy: {
        Args: { user_id: string }
        Returns: boolean
      }
      update_client_program: {
        Args: { user_id_param: string; program_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      program_type: "moai_run" | "moai_strength"
      workout_type: "cardio" | "strength" | "mobility" | "flexibility"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      program_type: ["moai_run", "moai_strength"],
      workout_type: ["cardio", "strength", "mobility", "flexibility"],
    },
  },
} as const
