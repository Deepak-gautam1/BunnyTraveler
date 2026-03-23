export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      communities: {
        Row: {
          created_at: string | null
          description: string | null
          emoji: string
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          emoji: string
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string | null
          id: string
          joined_at: string | null
          user_id: string | null
        }
        Insert: {
          community_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Update: {
          community_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          discount_type: string | null
          discount_value: number | null
          id: string
          is_active: boolean | null
          partner_logo_url: string | null
          partner_name: string
          title: string
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_active?: boolean | null
          partner_logo_url?: string | null
          partner_name: string
          title: string
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_active?: boolean | null
          partner_logo_url?: string | null
          partner_name?: string
          title?: string
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: number
          sender_id: string
          trip_id: number
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: never
          sender_id: string
          trip_id: number
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: never
          sender_id?: string
          trip_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_trip_id: number | null
          related_user_id: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_trip_id?: number | null
          related_user_id?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_trip_id?: number | null
          related_user_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_trip_id_fkey"
            columns: ["related_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      private_messages: {
        Row: {
          content: string
          created_at: string
          id: number
          read_at: string | null
          receiver_id: string
          sender_id: string
          trip_id: number | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: never
          read_at?: string | null
          receiver_id: string
          sender_id: string
          trip_id?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: never
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          trip_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "private_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          email_verified: boolean | null
          email_verified_at: string | null
          full_name: string | null
          home_city: string | null
          id: string
          privacy_accepted_at: string | null
          tagline: string | null
          terms_accepted_at: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          full_name?: string | null
          home_city?: string | null
          id: string
          privacy_accepted_at?: string | null
          tagline?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          full_name?: string | null
          home_city?: string | null
          id?: string
          privacy_accepted_at?: string | null
          tagline?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      trip_activities: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          message: string | null
          trip_id: number
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          message?: string | null
          trip_id: number
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          message?: string | null
          trip_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_activities_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_bookmarks: {
        Row: {
          bookmarked_at: string | null
          id: number
          trip_id: number
          user_id: string
        }
        Insert: {
          bookmarked_at?: string | null
          id?: never
          trip_id: number
          user_id: string
        }
        Update: {
          bookmarked_at?: string | null
          id?: never
          trip_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_bookmarks_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_join_requests: {
        Row: {
          id: number
          message: string | null
          referral_code: string | null
          requested_at: string | null
          responded_at: string | null
          responded_by: string | null
          response_message: string | null
          status: string
          trip_id: number
          user_id: string
        }
        Insert: {
          id?: never
          message?: string | null
          referral_code?: string | null
          requested_at?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_message?: string | null
          status?: string
          trip_id: number
          user_id: string
        }
        Update: {
          id?: never
          message?: string | null
          referral_code?: string | null
          requested_at?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_message?: string | null
          status?: string
          trip_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_join_requests_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_join_requests_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_join_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_likes: {
        Row: {
          created_at: string
          id: string
          trip_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          trip_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          trip_id?: number
          user_id?: string
        }
        Relationships: []
      }
      trip_notifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          notification_type: string
          opened_at: string | null
          scheduled_for: string
          sent_at: string | null
          title: string
          trip_id: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          notification_type: string
          opened_at?: string | null
          scheduled_for: string
          sent_at?: string | null
          title: string
          trip_id?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          notification_type?: string
          opened_at?: string | null
          scheduled_for?: string
          sent_at?: string | null
          title?: string
          trip_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_notifications_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_participants: {
        Row: {
          joined_at: string | null
          referral_code_used: string | null
          trip_id: number
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          referral_code_used?: string | null
          trip_id: number
          user_id: string
        }
        Update: {
          joined_at?: string | null
          referral_code_used?: string | null
          trip_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          file_size: number | null
          id: string
          is_cover_photo: boolean | null
          mime_type: string | null
          thumb_url: string
          trip_id: number | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          file_size?: number | null
          id?: string
          is_cover_photo?: boolean | null
          mime_type?: string | null
          thumb_url: string
          trip_id?: number | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          file_size?: number | null
          id?: string
          is_cover_photo?: boolean | null
          mime_type?: string | null
          thumb_url?: string
          trip_id?: number | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_photos_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_reviews: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          photo_count: number | null
          photo_urls: string[] | null
          rating: number | null
          trip_id: number | null
          user_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          photo_count?: number | null
          photo_urls?: string[] | null
          rating?: number | null
          trip_id?: number | null
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          photo_count?: number | null
          photo_urls?: string[] | null
          rating?: number | null
          trip_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_reviews_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: number
          new_status: string
          old_status: string | null
          reason: string | null
          trip_id: number | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: number
          new_status: string
          old_status?: string | null
          reason?: string | null
          trip_id?: number | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: number
          new_status?: string
          old_status?: string | null
          reason?: string | null
          trip_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_status_history_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          budget: number | null
          budget_per_person: number | null
          completed_at: string | null
          coupon_awarded: boolean | null
          coupon_awarded_at: string | null
          created_at: string | null
          creator_id: string
          current_participants: number | null
          description: string | null
          destination: string
          end_date: string
          id: number
          interested_count: number | null
          max_group_size: number
          max_participants: number | null
          referral_code: string | null
          start_city: string
          start_date: string
          start_lat: number | null
          start_lng: number | null
          status: string | null
          travel_style: string[] | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          budget_per_person?: number | null
          completed_at?: string | null
          coupon_awarded?: boolean | null
          coupon_awarded_at?: string | null
          created_at?: string | null
          creator_id: string
          current_participants?: number | null
          description?: string | null
          destination: string
          end_date: string
          id?: never
          interested_count?: number | null
          max_group_size?: number
          max_participants?: number | null
          referral_code?: string | null
          start_city: string
          start_date: string
          start_lat?: number | null
          start_lng?: number | null
          status?: string | null
          travel_style?: string[] | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          budget_per_person?: number | null
          completed_at?: string | null
          coupon_awarded?: boolean | null
          coupon_awarded_at?: string | null
          created_at?: string | null
          creator_id?: string
          current_participants?: number | null
          description?: string | null
          destination?: string
          end_date?: string
          id?: never
          interested_count?: number | null
          max_group_size?: number
          max_participants?: number | null
          referral_code?: string | null
          start_city?: string
          start_date?: string
          start_lat?: number | null
          start_lng?: number | null
          status?: string | null
          travel_style?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_coupons: {
        Row: {
          awarded_at: string | null
          coupon_id: string
          id: string
          status: string | null
          trip_id: number | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          coupon_id: string
          id?: string
          status?: string | null
          trip_id?: number | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          coupon_id?: string
          id?: string
          status?: string | null
          trip_id?: number | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_coupons_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          marketing_emails: boolean | null
          new_messages: boolean | null
          push_notifications: boolean | null
          trip_updates: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          new_messages?: boolean | null
          push_notifications?: boolean | null
          trip_updates?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          new_messages?: boolean | null
          push_notifications?: boolean | null
          trip_updates?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_join_request: {
        Args: {
          request_id_param: number
          trip_id_param: number
          user_id_param: string
        }
        Returns: undefined
      }
      archive_expired_trips: {
        Args: never
        Returns: {
          completed_count: number
          execution_time: string
        }[]
      }
      can_change_trip_status: {
        Args: { trip_id_param: number }
        Returns: boolean
      }
      debug_recommended_trips: {
        Args: { input_user_id: string }
        Returns: {
          creator_id: string
          destination: string
          has_spots: boolean
          is_bookmarked: boolean
          is_joined: boolean
          is_own_trip: boolean
          should_include: boolean
          trip_id: number
        }[]
      }
      decrement_interested_count: {
        Args: { trip_id: number }
        Returns: undefined
      }
      delete_expired_trip_notifications: { Args: never; Returns: undefined }
      delete_expired_trips: { Args: never; Returns: undefined }
      get_recommended_trips: {
        Args: { input_user_id: string; max_results?: number }
        Returns: {
          budget_per_person: number
          creator_avatar: string
          creator_name: string
          current_participants: number
          description: string
          destination: string
          end_date: string
          max_participants: number
          recommendation_score: number
          start_city: string
          start_date: string
          travel_style: string[]
          trip_id: number
        }[]
      }
      increment_interested_count: {
        Args: { trip_id: number }
        Returns: undefined
      }
      is_trip_member: { Args: { trip_id_param: number }; Returns: boolean }
      toggle_message_reaction: {
        Args: { p_emoji: string; p_message_id: number; p_user_id: string }
        Returns: {
          action: string
          reaction_id: string
        }[]
      }
      update_trip_statuses: { Args: never; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
