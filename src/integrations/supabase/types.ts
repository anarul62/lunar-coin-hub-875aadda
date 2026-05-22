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
      invest_channels: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          key: string
          name: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          name: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          name?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      invest_plans: {
        Row: {
          channel_id: string
          compound: boolean
          created_at: string
          currency: string
          duration_days: number
          enabled: boolean
          featured: boolean
          id: string
          image_url: string | null
          interest_period: string
          interest_type: string
          interest_value: number
          max_amount: number
          min_amount: number
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          channel_id: string
          compound?: boolean
          created_at?: string
          currency?: string
          duration_days?: number
          enabled?: boolean
          featured?: boolean
          id?: string
          image_url?: string | null
          interest_period?: string
          interest_type?: string
          interest_value?: number
          max_amount?: number
          min_amount?: number
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          channel_id?: string
          compound?: boolean
          created_at?: string
          currency?: string
          duration_days?: number
          enabled?: boolean
          featured?: boolean
          id?: string
          image_url?: string | null
          interest_period?: string
          interest_type?: string
          interest_value?: number
          max_amount?: number
          min_amount?: number
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invest_plans_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "invest_channels"
            referencedColumns: ["id"]
          },
        ]
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
      lottery_entries: {
        Row: {
          amount_paid: number
          created_at: string
          currency: string
          id: string
          plan_id: string
          tickets_assigned: number
          tickets_count: number
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          currency: string
          id?: string
          plan_id: string
          tickets_assigned?: number
          tickets_count: number
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          currency?: string
          id?: string
          plan_id?: string
          tickets_assigned?: number
          tickets_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lottery_entries_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "lottery_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lottery_plans: {
        Row: {
          auto_recreate: boolean
          channel_id: string | null
          created_at: string
          currency: string
          draw_at: string
          duration_minutes: number
          enabled: boolean
          game_image_url: string | null
          hide_after_minutes: number
          hide_after_seconds: number
          id: string
          image_url: string | null
          name: string
          pct_4_11: number
          pct_4_11_enabled: boolean
          pct_company: number
          pct_first: number
          pct_second: number
          pct_third: number
          prize_mode: string
          recreate_days: number
          recreate_hours: number
          recreate_minutes: number
          sort_order: number
          status: string
          ticket_price: number
          total_tickets: number
          updated_at: string
          xcoin_bonus: number | null
        }
        Insert: {
          auto_recreate?: boolean
          channel_id?: string | null
          created_at?: string
          currency?: string
          draw_at?: string
          duration_minutes?: number
          enabled?: boolean
          game_image_url?: string | null
          hide_after_minutes?: number
          hide_after_seconds?: number
          id?: string
          image_url?: string | null
          name: string
          pct_4_11?: number
          pct_4_11_enabled?: boolean
          pct_company?: number
          pct_first?: number
          pct_second?: number
          pct_third?: number
          prize_mode?: string
          recreate_days?: number
          recreate_hours?: number
          recreate_minutes?: number
          sort_order?: number
          status?: string
          ticket_price?: number
          total_tickets?: number
          updated_at?: string
          xcoin_bonus?: number | null
        }
        Update: {
          auto_recreate?: boolean
          channel_id?: string | null
          created_at?: string
          currency?: string
          draw_at?: string
          duration_minutes?: number
          enabled?: boolean
          game_image_url?: string | null
          hide_after_minutes?: number
          hide_after_seconds?: number
          id?: string
          image_url?: string | null
          name?: string
          pct_4_11?: number
          pct_4_11_enabled?: boolean
          pct_company?: number
          pct_first?: number
          pct_second?: number
          pct_third?: number
          prize_mode?: string
          recreate_days?: number
          recreate_hours?: number
          recreate_minutes?: number
          sort_order?: number
          status?: string
          ticket_price?: number
          total_tickets?: number
          updated_at?: string
          xcoin_bonus?: number | null
        }
        Relationships: []
      }
      lottery_results: {
        Row: {
          created_at: string
          currency: string
          id: string
          paid: boolean
          plan_id: string
          prize_amount: number
          rank: number
          ticket_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency: string
          id?: string
          paid?: boolean
          plan_id: string
          prize_amount?: number
          rank: number
          ticket_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          paid?: boolean
          plan_id?: string
          prize_amount?: number
          rank?: number
          ticket_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lottery_results_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "lottery_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lottery_results_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "lottery_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      lottery_tickets: {
        Row: {
          booked_at: string | null
          code: string
          id: string
          plan_id: string
          ticket_number: number
          user_id: string | null
        }
        Insert: {
          booked_at?: string | null
          code: string
          id?: string
          plan_id: string
          ticket_number: number
          user_id?: string | null
        }
        Update: {
          booked_at?: string | null
          code?: string
          id?: string
          plan_id?: string
          ticket_number?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lottery_tickets_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "lottery_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          amount: number | null
          audience: string
          body: string | null
          created_at: string
          currency: string | null
          id: string
          link: string | null
          meta: Json
          read: boolean
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          audience?: string
          body?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          link?: string | null
          meta?: Json
          read?: boolean
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          audience?: string
          body?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          link?: string | null
          meta?: Json
          read?: boolean
          title?: string
          type?: string
          user_id?: string | null
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
          blocked: boolean
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
          blocked?: boolean
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
          blocked?: boolean
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
      user_investments: {
        Row: {
          amount: number
          channel_id: string | null
          channel_name: string | null
          compound: boolean | null
          created_at: string
          currency: string
          duration_days: number
          ends_at: string | null
          expected_return: number
          id: string
          interest_period: string | null
          interest_type: string | null
          interest_value: number | null
          plan_id: string | null
          plan_image_url: string | null
          plan_name: string
          profit: number
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          channel_id?: string | null
          channel_name?: string | null
          compound?: boolean | null
          created_at?: string
          currency?: string
          duration_days?: number
          ends_at?: string | null
          expected_return?: number
          id?: string
          interest_period?: string | null
          interest_type?: string | null
          interest_value?: number | null
          plan_id?: string | null
          plan_image_url?: string | null
          plan_name: string
          profit?: number
          starts_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          channel_id?: string | null
          channel_name?: string | null
          compound?: boolean | null
          created_at?: string
          currency?: string
          duration_days?: number
          ends_at?: string | null
          expected_return?: number
          id?: string
          interest_period?: string | null
          interest_type?: string | null
          interest_value?: number | null
          plan_id?: string | null
          plan_image_url?: string | null
          plan_name?: string
          profit?: number
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
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
      payment_methods_public: {
        Row: {
          config: Json | null
          currency: string | null
          enabled: boolean | null
          gateway_provider: string | null
          icon_url: string | null
          id: string | null
          label: string | null
          method_key: string | null
          min_amount: number | null
          mode: string | null
          preset_amounts: Json | null
          rate: number | null
          sort_order: number | null
        }
        Insert: {
          config?: Json | null
          currency?: string | null
          enabled?: boolean | null
          gateway_provider?: string | null
          icon_url?: string | null
          id?: string | null
          label?: string | null
          method_key?: string | null
          min_amount?: number | null
          mode?: string | null
          preset_amounts?: Json | null
          rate?: number | null
          sort_order?: number | null
        }
        Update: {
          config?: Json | null
          currency?: string | null
          enabled?: boolean | null
          gateway_provider?: string | null
          icon_url?: string | null
          id?: string | null
          label?: string | null
          method_key?: string | null
          min_amount?: number | null
          mode?: string | null
          preset_amounts?: Json | null
          rate?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      gen_referral_code: { Args: never; Returns: string }
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
      app_role: ["admin", "moderator", "user"],
      kyc_status: ["pending", "approved", "rejected"],
    },
  },
} as const
