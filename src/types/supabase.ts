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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          category: string
          content: string
          created_at: string | null
          excerpt: string
          featured: boolean | null
          featured_image: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published: boolean | null
          read_time: string
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          excerpt: string
          featured?: boolean | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean | null
          read_time: string
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          excerpt?: string
          featured?: boolean | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean | null
          read_time?: string
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          created_at: string | null
          criteria: string
          description: string
          display_name: string
          icon_url: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          criteria: string
          description: string
          display_name: string
          icon_url: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          criteria?: string
          description?: string
          display_name?: string
          icon_url?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_user_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          approval_status: string
          category: string
          content: string
          created_at: string | null
          excerpt: string
          id: string
          image_url: string | null
          meta_description: string | null
          meta_title: string | null
          read_time: string
          slug: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approval_status?: string
          category: string
          content: string
          created_at?: string | null
          excerpt: string
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          read_time: string
          slug: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approval_status?: string
          category?: string
          content?: string
          created_at?: string | null
          excerpt?: string
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          read_time?: string
          slug?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_messages: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          client_id: string
          created_at: string | null
          currency: string | null
          duration_minutes: number
          end_time: string
          id: string
          notes: string | null
          package_id: string | null
          practitioner_id: string
          price: number | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"] | null
          updated_at: string | null
        }
        Insert: {
          booking_date: string
          client_id: string
          created_at?: string | null
          currency?: string | null
          duration_minutes: number
          end_time: string
          id?: string
          notes?: string | null
          package_id?: string | null
          practitioner_id: string
          price?: number | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string | null
        }
        Update: {
          booking_date?: string
          client_id?: string
          created_at?: string | null
          currency?: string | null
          duration_minutes?: number
          end_time?: string
          id?: string
          notes?: string | null
          package_id?: string | null
          practitioner_id?: string
          price?: number | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "practitioner_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          about_images: string[] | null
          about_text: string | null
          avatar_url: string | null
          banner_url: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          team_members: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          about_images?: string[] | null
          about_text?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          team_members?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          about_images?: string[] | null
          about_text?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          team_members?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_join_requests: {
        Row: {
          community_id: string
          created_at: string | null
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          id?: string
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_join_requests_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_join_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          created_at: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_notification_settings: {
        Row: {
          community_id: string
          created_at: string | null
          enabled: boolean | null
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          enabled?: boolean | null
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          enabled?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_notification_settings_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_likes: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          community_id: string
          content: string
          created_at: string | null
          id: string
          images: string[] | null
          pinned: boolean | null
          pinned_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          content: string
          created_at?: string | null
          id?: string
          images?: string[] | null
          pinned?: boolean | null
          pinned_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          content?: string
          created_at?: string | null
          id?: string
          images?: string[] | null
          pinned?: boolean | null
          pinned_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          admin_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          is_public: boolean | null
          last_message: string | null
          last_message_at: string | null
          last_viewed_at: string | null
          last_viewed_by: string | null
          max_participants: number
          name: string | null
          participant_ids: string[]
          slug: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          last_viewed_at?: string | null
          last_viewed_by?: string | null
          max_participants?: number
          name?: string | null
          participant_ids: string[]
          slug?: string | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          last_viewed_at?: string | null
          last_viewed_by?: string | null
          max_participants?: number
          name?: string | null
          participant_ids?: string[]
          slug?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_last_viewed_by_fkey"
            columns: ["last_viewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          amount: number
          completed_at: string | null
          course_id: string
          currency: string
          enrolled_at: string | null
          id: string
          payment_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          course_id: string
          currency: string
          enrolled_at?: string | null
          id?: string
          payment_id?: string | null
          status: string
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          course_id?: string
          currency?: string
          enrolled_at?: string | null
          id?: string
          payment_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string | null
          id: string
          lesson_id: string
          total_duration: number
          updated_at: string | null
          user_id: string
          watched_duration: number | null
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          lesson_id: string
          total_duration: number
          updated_at?: string | null
          user_id: string
          watched_duration?: number | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          lesson_id?: string
          total_duration?: number
          updated_at?: string | null
          user_id?: string
          watched_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          approval_status: string
          category: string
          created_at: string | null
          currency: string
          description: string
          id: string
          language: string
          price: number
          slug: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approval_status?: string
          category: string
          created_at?: string | null
          currency?: string
          description: string
          id?: string
          language: string
          price?: number
          slug: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approval_status?: string
          category?: string
          created_at?: string | null
          currency?: string
          description?: string
          id?: string
          language?: string
          price?: number
          slug?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          approval_status: string | null
          community_id: string | null
          country: string | null
          created_at: string | null
          current_participants: number | null
          description: string
          end_date: string
          event_type: string
          id: string
          image_url: string | null
          images: string[] | null
          location: string
          max_participants: number | null
          pinned: boolean | null
          pinned_at: string | null
          price: number | null
          slug: string
          start_date: string
          ticket_url: string | null
          title: string
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          approval_status?: string | null
          community_id?: string | null
          country?: string | null
          created_at?: string | null
          current_participants?: number | null
          description: string
          end_date: string
          event_type: string
          id?: string
          image_url?: string | null
          images?: string[] | null
          location: string
          max_participants?: number | null
          pinned?: boolean | null
          pinned_at?: string | null
          price?: number | null
          slug: string
          start_date: string
          ticket_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          approval_status?: string | null
          community_id?: string | null
          country?: string | null
          created_at?: string | null
          current_participants?: number | null
          description?: string
          end_date?: string
          event_type?: string
          id?: string
          image_url?: string | null
          images?: string[] | null
          location?: string
          max_participants?: number | null
          pinned?: boolean | null
          pinned_at?: string | null
          price?: number | null
          slug?: string
          start_date?: string
          ticket_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      field_invitations: {
        Row: {
          created_at: string | null
          field_id: string
          id: string
          invitee_id: string
          inviter_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          field_id: string
          id?: string
          invitee_id: string
          inviter_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          field_id?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_invitations_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_invitations_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      field_members: {
        Row: {
          created_at: string | null
          field_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          field_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          field_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_members_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      field_notes: {
        Row: {
          content: string
          created_at: string | null
          field_id: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string | null
          field_id: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          field_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_notes_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: true
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      field_tasks: {
        Row: {
          created_at: string | null
          crop_name: string | null
          date: string
          details: string | null
          field_id: string
          id: string
          task_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          crop_name?: string | null
          date: string
          details?: string | null
          field_id: string
          id?: string
          task_type: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          crop_name?: string | null
          date?: string
          details?: string | null
          field_id?: string
          id?: string
          task_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_tasks_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fields: {
        Row: {
          country: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          country: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          country?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fields_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      garden_layouts: {
        Row: {
          created_at: string | null
          elements: Json
          field_id: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          elements?: Json
          field_id: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          elements?: Json
          field_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "garden_layouts_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garden_layouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      job_offers: {
        Row: {
          approval_status: string | null
          company_name: string
          contact_email: string
          country: string | null
          created_at: string | null
          description: string
          id: string
          job_type: string
          location: string
          requirements: string[]
          salary_range: string
          slug: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approval_status?: string | null
          company_name: string
          contact_email: string
          country?: string | null
          created_at?: string | null
          description: string
          id?: string
          job_type: string
          location: string
          requirements: string[]
          salary_range: string
          slug: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approval_status?: string | null
          company_name?: string
          contact_email?: string
          country?: string | null
          created_at?: string | null
          description?: string
          id?: string
          job_type?: string
          location?: string
          requirements?: string[]
          salary_range?: string
          slug?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_offers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content_url: string
          course_id: string
          created_at: string | null
          description: string
          duration: number
          id: string
          order_number: number
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          content_url: string
          course_id: string
          created_at?: string | null
          description: string
          duration: number
          id?: string
          order_number: number
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          content_url?: string
          course_id?: string
          created_at?: string | null
          description?: string
          duration?: number
          id?: string
          order_number?: number
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      live_stream_settings: {
        Row: {
          chat_enabled: boolean | null
          description: string | null
          id: string
          is_live: boolean | null
          last_check_time: string | null
          stream_status: Database["public"]["Enums"]["stream_status"] | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
          viewer_count: number | null
        }
        Insert: {
          chat_enabled?: boolean | null
          description?: string | null
          id?: string
          is_live?: boolean | null
          last_check_time?: string | null
          stream_status?: Database["public"]["Enums"]["stream_status"] | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          viewer_count?: number | null
        }
        Update: {
          chat_enabled?: boolean | null
          description?: string | null
          id?: string
          is_live?: boolean | null
          last_check_time?: string | null
          stream_status?: Database["public"]["Enums"]["stream_status"] | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      livestream_schedule: {
        Row: {
          created_at: string | null
          day_of_week: number
          host: string
          id: string
          time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          host: string
          id?: string
          time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          host?: string
          id?: string
          time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          audio_duration: number | null
          audio_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          message_type: string | null
          sender_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          audio_duration?: number | null
          audio_url?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message_type?: string | null
          sender_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          audio_duration?: number | null
          audio_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message_type?: string | null
          sender_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      muted_users: {
        Row: {
          created_at: string | null
          id: string
          muted_by: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          muted_by: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          muted_by?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "muted_users_muted_by_fkey"
            columns: ["muted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "muted_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_identification_attempts: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_identification_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_availability: {
        Row: {
          created_at: string | null
          current_bookings: number | null
          date: string
          end_time: string
          id: string
          is_available: boolean | null
          max_bookings: number | null
          practitioner_id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_bookings?: number | null
          date: string
          end_time: string
          id?: string
          is_available?: boolean | null
          max_bookings?: number | null
          practitioner_id: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_bookings?: number | null
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          max_bookings?: number | null
          practitioner_id?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_availability_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_availability_exceptions: {
        Row: {
          created_at: string | null
          custom_end_time: string | null
          custom_slot_duration_minutes: number | null
          custom_start_time: string | null
          date: string
          id: string
          is_available: boolean
          notes: string | null
          practitioner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_end_time?: string | null
          custom_slot_duration_minutes?: number | null
          custom_start_time?: string | null
          date: string
          id?: string
          is_available: boolean
          notes?: string | null
          practitioner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_end_time?: string | null
          custom_slot_duration_minutes?: number | null
          custom_start_time?: string | null
          date?: string
          id?: string
          is_available?: boolean
          notes?: string | null
          practitioner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_availability_exceptions_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_packages: {
        Row: {
          created_at: string
          currency: string
          description: string
          features: string[]
          id: string
          name: string
          practitioner_id: string | null
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description: string
          features?: string[]
          id?: string
          name: string
          practitioner_id?: string | null
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string
          features?: string[]
          id?: string
          name?: string
          practitioner_id?: string | null
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_packages_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_working_hours: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          max_bookings_per_slot: number | null
          practitioner_id: string
          slot_duration_minutes: number
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          max_bookings_per_slot?: number | null
          practitioner_id: string
          slot_duration_minutes?: number
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          max_bookings_per_slot?: number | null
          practitioner_id?: string
          slot_duration_minutes?: number
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_working_hours_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioners: {
        Row: {
          address: string | null
          approval_status: string | null
          booking_available: boolean | null
          category: string
          certification_url: string | null
          corporate_wellness: boolean | null
          country: string
          created_at: string | null
          currency: string | null
          description: string
          faqs: string | null
          id: string
          images: string[] | null
          language: string
          slug: string
          starting_price: number | null
          title: string
          updated_at: string | null
          user_id: string
          work_arrangement: string
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          booking_available?: boolean | null
          category: string
          certification_url?: string | null
          corporate_wellness?: boolean | null
          country: string
          created_at?: string | null
          currency?: string | null
          description: string
          faqs?: string | null
          id?: string
          images?: string[] | null
          language: string
          slug: string
          starting_price?: number | null
          title: string
          updated_at?: string | null
          user_id: string
          work_arrangement: string
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          booking_available?: boolean | null
          category?: string
          certification_url?: string | null
          corporate_wellness?: boolean | null
          country?: string
          created_at?: string | null
          currency?: string | null
          description?: string
          faqs?: string | null
          id?: string
          images?: string[] | null
          language?: string
          slug?: string
          starting_price?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
          work_arrangement?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: never
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: never
          user_id?: string | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          approval_status: string
          cook_time: number
          created_at: string | null
          cuisine_type: string
          description: string
          dietary_preferences: string[]
          difficulty: string
          id: string
          image_url: string | null
          ingredients: string[]
          instructions: string[]
          prep_time: number
          servings: number
          slug: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approval_status?: string
          cook_time: number
          created_at?: string | null
          cuisine_type: string
          description: string
          dietary_preferences: string[]
          difficulty: string
          id?: string
          image_url?: string | null
          ingredients: string[]
          instructions: string[]
          prep_time: number
          servings: number
          slug: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approval_status?: string
          cook_time?: number
          created_at?: string | null
          cuisine_type?: string
          description?: string
          dietary_preferences?: string[]
          difficulty?: string
          id?: string
          image_url?: string | null
          ingredients?: string[]
          instructions?: string[]
          prep_time?: number
          servings?: number
          slug?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      revenuecat_entitlements: {
        Row: {
          created_at: string | null
          description: string | null
          entitlement_id: string
          features: string[] | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entitlement_id: string
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entitlement_id?: string
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      revenuecat_products: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          interval: string | null
          interval_count: number | null
          is_active: boolean | null
          name: string
          platform: string
          price: number | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: string | null
          interval_count?: number | null
          is_active?: boolean | null
          name: string
          platform: string
          price?: number | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: string | null
          interval_count?: number | null
          is_active?: boolean | null
          name?: string
          platform?: string
          price?: number | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      revenuecat_subscriptions: {
        Row: {
          created_at: string | null
          entitlement_id: string
          expiration_date: string | null
          id: string
          is_active: boolean | null
          is_sandbox: boolean | null
          is_trial: boolean | null
          latest_receipt_info: Json | null
          original_transaction_id: string | null
          platform: string
          product_id: string
          purchase_date: string
          revenuecat_user_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entitlement_id: string
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          is_sandbox?: boolean | null
          is_trial?: boolean | null
          latest_receipt_info?: Json | null
          original_transaction_id?: string | null
          platform: string
          product_id: string
          purchase_date: string
          revenuecat_user_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entitlement_id?: string
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          is_sandbox?: boolean | null
          is_trial?: boolean | null
          latest_receipt_info?: Json | null
          original_transaction_id?: string | null
          platform?: string
          product_id?: string
          purchase_date?: string
          revenuecat_user_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenuecat_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          currency: string
          description: string | null
          id: string
          interval: string
          name: string
          price: number
          stripe_price_id: string
          subscription_interval: number
          subscription_period: string
        }
        Insert: {
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          interval: string
          name: string
          price: number
          stripe_price_id: string
          subscription_interval?: number
          subscription_period?: string
        }
        Update: {
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          interval?: string
          name?: string
          price?: number
          stripe_price_id?: string
          subscription_interval?: number
          subscription_period?: string
        }
        Relationships: []
      }
      ticket_purchases: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          payment_id: string
          quantity: number
          status: string
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          payment_id: string
          quantity: number
          status: string
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          payment_id?: string
          quantity?: number
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_purchases_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_sales: {
        Row: {
          buyer_id: string
          created_at: string | null
          event_id: string
          id: string
          platform_fee: number
          quantity: number
          seller_id: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          total_amount: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          event_id: string
          id?: string
          platform_fee?: number
          quantity: number
          seller_id: string
          status: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          total_amount: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          event_id?: string
          id?: string
          platform_fee?: number
          quantity?: number
          seller_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          total_amount?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_sales_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_sales_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "timeline_post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "timeline_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_post_likes: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "timeline_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          images: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          images?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          images?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          is_online: boolean | null
          last_seen: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          is_online?: boolean | null
          last_seen?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          is_online?: boolean | null
          last_seen?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          is_displayed: boolean | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          is_displayed?: boolean | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          is_displayed?: boolean | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string | null
          current_period_end: string
          current_period_start: string
          expiration_notification_sent: boolean
          id: string
          plan_id: string
          revenuecat_entitlement_id: string | null
          revenuecat_platform: string | null
          revenuecat_product_id: string | null
          revenuecat_subscription_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          subscription_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          expiration_notification_sent?: boolean
          id?: string
          plan_id: string
          revenuecat_entitlement_id?: string | null
          revenuecat_platform?: string | null
          revenuecat_product_id?: string | null
          revenuecat_subscription_id?: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          subscription_type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          expiration_notification_sent?: boolean
          id?: string
          plan_id?: string
          revenuecat_entitlement_id?: string | null
          revenuecat_platform?: string | null
          revenuecat_product_id?: string | null
          revenuecat_subscription_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          subscription_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          interests: string[] | null
          is_admin: boolean | null
          onboarding_completed: boolean | null
          onboarding_step: string | null
          onesignal_id: string | null
          revenuecat_original_app_user_id: string | null
          revenuecat_platform: string | null
          revenuecat_user_id: string | null
          stripe_connect_id: string | null
          stripe_connect_status: string | null
          stripe_customer_id: string | null
          subscription_status: string | null
          updated_at: string | null
          user_type: string | null
          username: string
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          interests?: string[] | null
          is_admin?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_step?: string | null
          onesignal_id?: string | null
          revenuecat_original_app_user_id?: string | null
          revenuecat_platform?: string | null
          revenuecat_user_id?: string | null
          stripe_connect_id?: string | null
          stripe_connect_status?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_type?: string | null
          username: string
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          interests?: string[] | null
          is_admin?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_step?: string | null
          onesignal_id?: string | null
          revenuecat_original_app_user_id?: string | null
          revenuecat_platform?: string | null
          revenuecat_user_id?: string | null
          stripe_connect_id?: string | null
          stripe_connect_status?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_type?: string | null
          username?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string
          amenities: string[]
          approval_status: string | null
          bathrooms: string
          bedrooms: string
          capacity: number
          contact_email: string
          contact_phone: string | null
          country: string | null
          created_at: string | null
          currency: string
          description: string
          id: string
          images: string[]
          kitchens: string
          name: string
          price: number
          price_period: string
          sleeping_places: string
          slug: string
          updated_at: string | null
          user_id: string
          venue_type: string | null
        }
        Insert: {
          address: string
          amenities: string[]
          approval_status?: string | null
          bathrooms?: string
          bedrooms?: string
          capacity: number
          contact_email: string
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string
          description: string
          id?: string
          images: string[]
          kitchens?: string
          name: string
          price: number
          price_period?: string
          sleeping_places?: string
          slug: string
          updated_at?: string | null
          user_id: string
          venue_type?: string | null
        }
        Update: {
          address?: string
          amenities?: string[]
          approval_status?: string | null
          bathrooms?: string
          bedrooms?: string
          capacity?: number
          contact_email?: string
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string
          description?: string
          id?: string
          images?: string[]
          kitchens?: string
          name?: string
          price?: number
          price_period?: string
          sleeping_places?: string
          slug?: string
          updated_at?: string | null
          user_id?: string
          venue_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_daily_attempts: { Args: { user_id: string }; Returns: number }
      cleanup_old_voice_messages: { Args: never; Returns: undefined }
      complete_user_onboarding: {
        Args: {
          avatar_url?: string
          final_interests?: string[]
          user_id: string
        }
        Returns: undefined
      }
      create_direct_chat: { Args: { other_user_id: string }; Returns: Json }
      create_group_chat: {
        Args: {
          group_description?: string
          group_image_url?: string
          group_name: string
          is_public_group?: boolean
          participant_user_ids?: string[]
        }
        Returns: Json
      }
      create_or_get_direct_chat: {
        Args: { user1_id: string; user2_id: string }
        Returns: Json
      }
      delete_user: { Args: { user_id: string }; Returns: undefined }
      delete_user_data: { Args: { user_id: string }; Returns: undefined }
      generate_availability_slots: {
        Args: { p_date: string; p_practitioner_id: string }
        Returns: {
          current_bookings: number
          end_time: string
          is_available: boolean
          max_bookings: number
          start_time: string
        }[]
      }
      generate_group_slug: { Args: { group_name: string }; Returns: string }
      generate_recipe_slug: { Args: { recipe_title: string }; Returns: string }
      generate_slug: { Args: { title: string }; Returns: string }
      generate_unique_slug: {
        Args: { exclude_id?: string; table_name: string; title: string }
        Returns: string
      }
      get_conversation_by_slug: {
        Args: { conversation_slug: string }
        Returns: Json
      }
      get_or_create_conversation: {
        Args: {
          p_creator_id: string
          p_participant_ids: string[]
          p_type?: string
        }
        Returns: string
      }
      get_practitioner_availability: {
        Args: {
          p_end_date: string
          p_practitioner_id: string
          p_start_date: string
        }
        Returns: {
          current_bookings: number
          date: string
          end_time: string
          id: string
          is_available: boolean
          max_bookings: number
          start_time: string
        }[]
      }
      get_stream_status: {
        Args: { p_channel_id: string }
        Returns: {
          description: string
          is_live: boolean
          stream_status: string
          title: string
          video_id: string
          viewer_count: number
        }[]
      }
      get_user_badges: {
        Args: { user_uuid: string }
        Returns: {
          badge_id: string
          badge_name: string
          category: string
          description: string
          display_name: string
          earned_at: string
          icon_url: string
          is_displayed: boolean
          metadata: Json
        }[]
      }
      get_user_displayed_badge: {
        Args: { user_uuid: string }
        Returns: {
          badge_id: string
          badge_name: string
          category: string
          description: string
          display_name: string
          icon_url: string
          metadata: Json
        }[]
      }
      has_revenuecat_subscription: {
        Args: { p_entitlement_id?: string; p_user_id: string }
        Returns: boolean
      }
      increment_event_participants: {
        Args: { p_event_id: string; p_quantity: number }
        Returns: undefined
      }
      is_blocked: {
        Args: { blocked_id: string; blocker_id: string }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { conversation_id: string }
        Returns: boolean
      }
      is_professional: { Args: { user_id: string }; Returns: boolean }
      is_time_slot_available: {
        Args: {
          p_date: string
          p_end_time: string
          p_practitioner_id: string
          p_start_time: string
        }
        Returns: boolean
      }
      is_user_blocked: {
        Args: { blocked_id: string; blocker_id: string }
        Returns: boolean
      }
      mark_inactive_users_offline: { Args: never; Returns: undefined }
      pin_community_event: {
        Args: { community_id: string; event_id: string }
        Returns: undefined
      }
      pin_community_post: {
        Args: { community_id: string; post_id: string }
        Returns: undefined
      }
      search_all: {
        Args: { search_query: string }
        Returns: {
          avatar_url: string
          created_at: string
          description: string
          id: string
          slug: string
          title: string
          type: string
          username: string
        }[]
      }
      should_create_direct_chat: {
        Args: { user_id_1: string; user_id_2: string }
        Returns: boolean
      }
      sync_revenuecat_subscription: {
        Args: {
          p_entitlement_id: string
          p_expiration_date: string
          p_is_active: boolean
          p_is_trial: boolean
          p_latest_receipt_info: Json
          p_original_transaction_id: string
          p_platform: string
          p_product_id: string
          p_purchase_date: string
          p_revenuecat_user_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      unpin_community_event: {
        Args: { community_id: string; event_id: string }
        Returns: undefined
      }
      unpin_community_post: {
        Args: { community_id: string; post_id: string }
        Returns: undefined
      }
      update_onboarding_step: {
        Args: { step: string; user_id: string }
        Returns: undefined
      }
      update_user_activity: { Args: never; Returns: undefined }
      update_user_interests: {
        Args: { new_interests: string[]; user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "accepted"
        | "declined"
        | "cancelled"
        | "completed"
      stream_status: "offline" | "starting" | "live" | "ending" | "ended"
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
      booking_status: [
        "pending",
        "accepted",
        "declined",
        "cancelled",
        "completed",
      ],
      stream_status: ["offline", "starting", "live", "ending", "ended"],
    },
  },
} as const
