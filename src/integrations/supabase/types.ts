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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      daily_matches: {
        Row: {
          compatibility_score: number
          created_at: string
          id: string
          match_date: string
          match_reasons: Json | null
          match_user_id: string
          user_id: string
        }
        Insert: {
          compatibility_score?: number
          created_at?: string
          id?: string
          match_date?: string
          match_reasons?: Json | null
          match_user_id: string
          user_id: string
        }
        Update: {
          compatibility_score?: number
          created_at?: string
          id?: string
          match_date?: string
          match_reasons?: Json | null
          match_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      interests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: Database["public"]["Enums"]["interest_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["interest_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["interest_status"]
          updated_at?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          plan_type: string | null
          started_at: string | null
          tier: Database["public"]["Enums"]["membership_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          plan_type?: string | null
          started_at?: string | null
          tier?: Database["public"]["Enums"]["membership_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          plan_type?: string | null
          started_at?: string | null
          tier?: Database["public"]["Enums"]["membership_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          related_user_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          related_user_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          related_user_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_preferences: {
        Row: {
          created_at: string
          id: string
          max_age: number | null
          max_height: string | null
          min_age: number | null
          min_height: string | null
          preferred_communities: string[] | null
          preferred_education: string[] | null
          preferred_locations: string[] | null
          preferred_marital_status: string | null
          preferred_religion: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_age?: number | null
          max_height?: string | null
          min_age?: number | null
          min_height?: string | null
          preferred_communities?: string[] | null
          preferred_education?: string[] | null
          preferred_locations?: string[] | null
          preferred_marital_status?: string | null
          preferred_religion?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_age?: number | null
          max_height?: string | null
          min_age?: number | null
          min_height?: string | null
          preferred_communities?: string[] | null
          preferred_education?: string[] | null
          preferred_locations?: string[] | null
          preferred_marital_status?: string | null
          preferred_religion?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          plan_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string | null
          status: string
          tier: Database["public"]["Enums"]["membership_tier"]
          upi_transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          plan_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string
          tier: Database["public"]["Enums"]["membership_tier"]
          upi_transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          plan_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string
          tier?: Database["public"]["Enums"]["membership_tier"]
          upi_transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          concierge_annual_price: number
          concierge_monthly_price: number
          id: string
          premium_annual_price: number
          premium_monthly_price: number
          qr_image_url: string | null
          updated_at: string
          updated_by: string | null
          upi_id: string | null
        }
        Insert: {
          concierge_annual_price?: number
          concierge_monthly_price?: number
          id?: string
          premium_annual_price?: number
          premium_monthly_price?: number
          qr_image_url?: string | null
          updated_at?: string
          updated_by?: string | null
          upi_id?: string | null
        }
        Update: {
          concierge_annual_price?: number
          concierge_monthly_price?: number
          id?: string
          premium_annual_price?: number
          premium_monthly_price?: number
          qr_image_url?: string | null
          updated_at?: string
          updated_by?: string | null
          upi_id?: string | null
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          id: string
          viewed_at: string
          viewed_id: string
          viewer_id: string
        }
        Insert: {
          id?: string
          viewed_at?: string
          viewed_id: string
          viewer_id: string
        }
        Update: {
          id?: string
          viewed_at?: string
          viewed_id?: string
          viewer_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          caste: string | null
          community: string | null
          created_at: string
          date_of_birth: string | null
          education: string | null
          education_detail: string | null
          family_type: string | null
          family_values: string | null
          father_occupation: string | null
          first_name: string | null
          gender: string | null
          guna_score: number | null
          height: string | null
          id: string
          income: string | null
          last_name: string | null
          location: string | null
          manglik: boolean | null
          marital_status: string | null
          match_score: number | null
          mother_occupation: string | null
          nakshatra: string | null
          phone: string | null
          photo_url: string | null
          profession: string | null
          profile_complete: boolean | null
          rashi: string | null
          religion: string | null
          siblings: string | null
          state: string | null
          updated_at: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          bio?: string | null
          caste?: string | null
          community?: string | null
          created_at?: string
          date_of_birth?: string | null
          education?: string | null
          education_detail?: string | null
          family_type?: string | null
          family_values?: string | null
          father_occupation?: string | null
          first_name?: string | null
          gender?: string | null
          guna_score?: number | null
          height?: string | null
          id?: string
          income?: string | null
          last_name?: string | null
          location?: string | null
          manglik?: boolean | null
          marital_status?: string | null
          match_score?: number | null
          mother_occupation?: string | null
          nakshatra?: string | null
          phone?: string | null
          photo_url?: string | null
          profession?: string | null
          profile_complete?: boolean | null
          rashi?: string | null
          religion?: string | null
          siblings?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          bio?: string | null
          caste?: string | null
          community?: string | null
          created_at?: string
          date_of_birth?: string | null
          education?: string | null
          education_detail?: string | null
          family_type?: string | null
          family_values?: string | null
          father_occupation?: string | null
          first_name?: string | null
          gender?: string | null
          guna_score?: number | null
          height?: string | null
          id?: string
          income?: string | null
          last_name?: string | null
          location?: string | null
          manglik?: boolean | null
          marital_status?: string | null
          match_score?: number | null
          mother_occupation?: string | null
          nakshatra?: string | null
          phone?: string | null
          photo_url?: string | null
          profession?: string | null
          profile_complete?: boolean | null
          rashi?: string | null
          religion?: string | null
          siblings?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      shortlists: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          user_id?: string
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          partner_name: string
          photo_url: string | null
          story: string
          title: string
          updated_at: string
          user_id: string
          wedding_date: string | null
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          partner_name: string
          photo_url?: string | null
          story: string
          title: string
          updated_at?: string
          user_id: string
          wedding_date?: string | null
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          partner_name?: string
          photo_url?: string | null
          story?: string
          title?: string
          updated_at?: string
          user_id?: string
          wedding_date?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      interest_status: "pending" | "accepted" | "declined"
      membership_tier: "free" | "premium" | "concierge"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      interest_status: ["pending", "accepted", "declined"],
      membership_tier: ["free", "premium", "concierge"],
    },
  },
} as const
