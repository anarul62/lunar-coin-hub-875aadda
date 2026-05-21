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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          active: boolean
          body: string | null
          created_at: string
          gift_code: string | null
          id: string
          image_url: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body?: string | null
          created_at?: string
          gift_code?: string | null
          id?: string
          image_url?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string | null
          created_at?: string
          gift_code?: string | null
          id?: string
          image_url?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      attendance_checkins: {
        Row: {
          amount_xcoin: number
          created_at: string
          date: string
          day_index: number
          id: string
          user_id: string
        }
        Insert: {
          amount_xcoin?: number
          created_at?: string
          date: string
          day_index: number
          id?: string
          user_id: string
        }
        Update: {
          amount_xcoin?: number
          created_at?: string
          date?: string
          day_index?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      attendance_rewards: {
        Row: {
          active: boolean
          amount_xcoin: number
          day: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount_xcoin?: number
          day: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount_xcoin?: number
          day?: number
          updated_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string
          link_url: string | null
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url: string
          link_url?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string
          link_url?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deposit_bonus_tiers: {
        Row: {
          active: boolean
          bonus_usdt: number
          created_at: string
          id: string
          min_deposit_usdt: number
        }
        Insert: {
          active?: boolean
          bonus_usdt: number
          created_at?: string
          id?: string
          min_deposit_usdt: number
        }
        Update: {
          active?: boolean
          bonus_usdt?: number
          created_at?: string
          id?: string
          min_deposit_usdt?: number
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          amount_usdt: number
          created_at: string
          currency: string
          id: string
          method_key: string | null
          method_label: string | null
          order_number: string | null
          rejection_reason: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          amount_usdt?: number
          created_at?: string
          currency?: string
          id?: string
          method_key?: string | null
          method_label?: string | null
          order_number?: string | null
          rejection_reason?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          amount_usdt?: number
          created_at?: string
          currency?: string
          id?: string
          method_key?: string | null
          method_label?: string | null
          order_number?: string | null
          rejection_reason?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kyc_requests: {
        Row: {
          created_at: string
          full_name: string
          id: string
          mobile: string
          pan_number: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          mobile: string
          pan_number: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          mobile?: string
          pan_number?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          config: Json
          created_at: string
          currency: string
          enabled: boolean
          gateway_config: Json
          gateway_provider: string | null
          icon_url: string | null
          id: string
          label: string
          method_key: string
          min_amount: number
          mode: string
          preset_amounts: Json
          rate: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          currency?: string
          enabled?: boolean
          gateway_config?: Json
          gateway_provider?: string | null
          icon_url?: string | null
          id?: string
          label: string
          method_key: string
          min_amount?: number
          mode?: string
          preset_amounts?: Json
          rate?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          currency?: string
          enabled?: boolean
          gateway_config?: Json
          gateway_provider?: string | null
          icon_url?: string | null
          id?: string
          label?: string
          method_key?: string
          min_amount?: number
          mode?: string
          preset_amounts?: Json
          rate?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance_usdt: number
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          invitation_code: string | null
          locked_bonus_usdt: number
          phone: string | null
          preferred_currency: string
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          balance_usdt?: number
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          invitation_code?: string | null
          locked_bonus_usdt?: number
          phone?: string | null
          preferred_currency?: string
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          balance_usdt?: number
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          invitation_code?: string | null
          locked_bonus_usdt?: number
          phone?: string | null
          preferred_currency?: string
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_claims: {
        Row: {
          amount_usdt: number
          claimed_user_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          amount_usdt?: number
          claimed_user_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          amount_usdt?: number
          claimed_user_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      site_seo_settings: {
        Row: {
          author: string
          bing_site_verification: string
          canonical_url: string
          custom_head: string
          description: string
          facebook_pixel_id: string
          favicon_url: string
          google_analytics_id: string
          google_site_verification: string
          gtm_id: string
          id: number
          json_ld: string
          keywords: string
          og_description: string
          og_image: string
          og_title: string
          robots: string
          robots_txt: string
          site_name: string
          sitemap_extra: string
          title: string
          twitter_handle: string
          updated_at: string
        }
        Insert: {
          author?: string
          bing_site_verification?: string
          canonical_url?: string
          custom_head?: string
          description?: string
          facebook_pixel_id?: string
          favicon_url?: string
          google_analytics_id?: string
          google_site_verification?: string
          gtm_id?: string
          id?: number
          json_ld?: string
          keywords?: string
          og_description?: string
          og_image?: string
          og_title?: string
          robots?: string
          robots_txt?: string
          site_name?: string
          sitemap_extra?: string
          title?: string
          twitter_handle?: string
          updated_at?: string
        }
        Update: {
          author?: string
          bing_site_verification?: string
          canonical_url?: string
          custom_head?: string
          description?: string
          facebook_pixel_id?: string
          favicon_url?: string
          google_analytics_id?: string
          google_site_verification?: string
          gtm_id?: string
          id?: number
          json_ld?: string
          keywords?: string
          og_description?: string
          og_image?: string
          og_title?: string
          robots?: string
          robots_txt?: string
          site_name?: string
          sitemap_extra?: string
          title?: string
          twitter_handle?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_withdraw_limits: {
        Row: {
          daily_max_times: number | null
          max_amount: number | null
          min_amount: number | null
          need_to_deposit_usdt: number | null
          need_to_refer: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          daily_max_times?: number | null
          max_amount?: number | null
          min_amount?: number | null
          need_to_deposit_usdt?: number | null
          need_to_refer?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          daily_max_times?: number | null
          max_amount?: number | null
          min_amount?: number | null
          need_to_deposit_usdt?: number | null
          need_to_refer?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_xcoin: {
        Row: {
          balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdraw_addresses: {
        Row: {
          created_at: string
          details: Json
          id: string
          is_default: boolean
          label: string | null
          method_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          is_default?: boolean
          label?: string | null
          method_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          is_default?: boolean
          label?: string | null
          method_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdraw_methods: {
        Row: {
          charge_currency: string
          charge_type: string
          charge_value: number
          config: Json
          created_at: string
          enabled: boolean
          icon_url: string | null
          id: string
          label: string
          method_key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          charge_currency?: string
          charge_type?: string
          charge_value?: number
          config?: Json
          created_at?: string
          enabled?: boolean
          icon_url?: string | null
          id?: string
          label: string
          method_key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          charge_currency?: string
          charge_type?: string
          charge_value?: number
          config?: Json
          created_at?: string
          enabled?: boolean
          icon_url?: string | null
          id?: string
          label?: string
          method_key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          address_snapshot: Json
          amount: number
          amount_usdt: number
          charge_usdt: number
          created_at: string
          currency: string
          id: string
          method_key: string
          method_label: string | null
          net_usdt: number
          order_number: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_snapshot?: Json
          amount?: number
          amount_usdt?: number
          charge_usdt?: number
          created_at?: string
          currency?: string
          id?: string
          method_key: string
          method_label?: string | null
          net_usdt?: number
          order_number?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_snapshot?: Json
          amount?: number
          amount_usdt?: number
          charge_usdt?: number
          created_at?: string
          currency?: string
          id?: string
          method_key?: string
          method_label?: string | null
          net_usdt?: number
          order_number?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      xcoin_gift_codes: {
        Row: {
          amount: number
          code: string
          created_at: string
          created_by: string | null
          expire_at: string | null
          id: string
          max_users: number
          note: string | null
          used_count: number
        }
        Insert: {
          amount?: number
          code: string
          created_at?: string
          created_by?: string | null
          expire_at?: string | null
          id?: string
          max_users?: number
          note?: string | null
          used_count?: number
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          created_by?: string | null
          expire_at?: string | null
          id?: string
          max_users?: number
          note?: string | null
          used_count?: number
        }
        Relationships: []
      }
      xcoin_gift_redemptions: {
        Row: {
          amount: number
          code_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          amount?: number
          code_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          code_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      xcoin_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          meta: Json
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          meta?: Json
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          meta?: Json
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gen_referral_code: { Args: never; Returns: string }
    }
    Enums: {
      kyc_status: "pending" | "approved" | "rejected"
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
      kyc_status: ["pending", "approved", "rejected"],
    },
  },
} as const
