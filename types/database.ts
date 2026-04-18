export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          username: string | null;
          email: string;
          avatar_url: string | null;
          bio: string | null;
          role: "student" | "employer" | "moderator" | "admin";
          status: "active" | "suspended" | "banned";
          university_id: string | null;
          branch_id: string | null;
          department: string | null;
          year_of_study: number | null;
          cgpa: number | null;
          graduation_year: number | null;
          linkedin: string | null;
          github: string | null;
          portfolio_url: string | null;
          theme: string;
          is_verified: boolean;
          last_active_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: "student" | "employer" | "moderator" | "admin";
          status?: "active" | "suspended" | "banned";
          university_id?: string | null;
          branch_id?: string | null;
          department?: string | null;
          year_of_study?: number | null;
          cgpa?: number | null;
          graduation_year?: number | null;
          linkedin?: string | null;
          github?: string | null;
          portfolio_url?: string | null;
          theme?: string;
          is_verified?: boolean;
          last_active_at?: string | null;
        };
        Update: {
          full_name?: string;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: "student" | "employer" | "moderator" | "admin";
          status?: "active" | "suspended" | "banned";
          university_id?: string | null;
          branch_id?: string | null;
          department?: string | null;
          year_of_study?: number | null;
          cgpa?: number | null;
          graduation_year?: number | null;
          linkedin?: string | null;
          github?: string | null;
          portfolio_url?: string | null;
          theme?: string;
          is_verified?: boolean;
          last_active_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "profiles_university_id_fkey", columns: ["university_id"], isOneToOne: false, referencedRelation: "universities", referencedColumns: ["id"] },
          { foreignKeyName: "profiles_branch_id_fkey", columns: ["branch_id"], isOneToOne: false, referencedRelation: "branches", referencedColumns: ["id"] }
        ];
      };
      universities: {
        Row: {
          id: string;
          name: string;
          short_name: string;
          slug: string;
          city: string | null;
          province: string | null;
          logo_url: string | null;
          cover_url: string | null;
          website: string | null;
          founding_year: number | null;
          total_students: number | null;
          is_featured: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          short_name: string;
          slug: string;
          id?: string;
          city?: string | null;
          province?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          website?: string | null;
          founding_year?: number | null;
          total_students?: number | null;
          is_featured?: boolean;
        };
        Update: {
          name?: string;
          short_name?: string;
          slug?: string;
          city?: string | null;
          province?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          website?: string | null;
          founding_year?: number | null;
          total_students?: number | null;
          is_featured?: boolean;
        };
        Relationships: [];
      };
      branches: {
        Row: {
          id: string;
          university_id: string;
          name: string;
          slug: string | null;
          city: string | null;
          created_at: string;
        };
        Insert: {
          university_id: string;
          name: string;
          id?: string;
          slug?: string | null;
          city?: string | null;
        };
        Update: {
          university_id?: string;
          name?: string;
          slug?: string | null;
          city?: string | null;
        };
        Relationships: [
          { foreignKeyName: "branches_university_id_fkey", columns: ["university_id"], isOneToOne: false, referencedRelation: "universities", referencedColumns: ["id"] }
        ];
      };
      channels: {
        Row: {
          id: string;
          type: "global" | "university" | "branch" | "dm";
          university_id: string | null;
          branch_id: string | null;
          dm_user_a: string | null;
          dm_user_b: string | null;
          name: string | null;
          created_at: string;
        };
        Insert: {
          type: "global" | "university" | "branch" | "dm";
          id?: string;
          university_id?: string | null;
          branch_id?: string | null;
          dm_user_a?: string | null;
          dm_user_b?: string | null;
          name?: string | null;
        };
        Update: {
          type?: "global" | "university" | "branch" | "dm";
          university_id?: string | null;
          branch_id?: string | null;
          dm_user_a?: string | null;
          dm_user_b?: string | null;
          name?: string | null;
        };
        Relationships: [
          { foreignKeyName: "channels_university_id_fkey", columns: ["university_id"], isOneToOne: false, referencedRelation: "universities", referencedColumns: ["id"] },
          { foreignKeyName: "channels_branch_id_fkey", columns: ["branch_id"], isOneToOne: false, referencedRelation: "branches", referencedColumns: ["id"] }
        ];
      };
      messages: {
        Row: {
          id: string;
          channel_id: string;
          sender_id: string;
          content: string | null;
          attachments: unknown[];
          reply_to: string | null;
          is_pinned: boolean;
          is_deleted: boolean;
          created_at: string;
        };
        Insert: {
          channel_id: string;
          sender_id: string;
          id?: string;
          content?: string | null;
          attachments?: unknown[];
          reply_to?: string | null;
          is_pinned?: boolean;
          is_deleted?: boolean;
        };
        Update: {
          content?: string | null;
          attachments?: unknown[];
          reply_to?: string | null;
          is_pinned?: boolean;
          is_deleted?: boolean;
        };
        Relationships: [
          { foreignKeyName: "messages_channel_id_fkey", columns: ["channel_id"], isOneToOne: false, referencedRelation: "channels", referencedColumns: ["id"] },
          { foreignKeyName: "messages_sender_id_fkey", columns: ["sender_id"], isOneToOne: false, referencedRelation: "profiles", referencedColumns: ["id"] }
        ];
      };
      notes: {
        Row: {
          id: string;
          uploader_id: string;
          title: string;
          description: string | null;
          subject: string;
          course_code: string | null;
          semester: string | null;
          university_id: string | null;
          file_url: string;
          file_type: string | null;
          file_size_bytes: number | null;
          thumbnail_url: string | null;
          ocr_text: string | null;
          upvotes: number;
          downvotes: number;
          downloads: number;
          status: "published" | "flagged" | "removed";
          created_at: string;
        };
        Insert: {
          uploader_id: string;
          title: string;
          subject: string;
          file_url: string;
          id?: string;
          description?: string | null;
          course_code?: string | null;
          semester?: string | null;
          university_id?: string | null;
          file_type?: string | null;
          file_size_bytes?: number | null;
          thumbnail_url?: string | null;
          ocr_text?: string | null;
          upvotes?: number;
          downvotes?: number;
          downloads?: number;
          status?: "published" | "flagged" | "removed";
        };
        Update: {
          title?: string;
          description?: string | null;
          subject?: string;
          course_code?: string | null;
          semester?: string | null;
          university_id?: string | null;
          file_url?: string;
          file_type?: string | null;
          file_size_bytes?: number | null;
          thumbnail_url?: string | null;
          ocr_text?: string | null;
          upvotes?: number;
          downvotes?: number;
          downloads?: number;
          status?: "published" | "flagged" | "removed";
        };
        Relationships: [
          { foreignKeyName: "notes_uploader_id_fkey", columns: ["uploader_id"], isOneToOne: false, referencedRelation: "profiles", referencedColumns: ["id"] },
          { foreignKeyName: "notes_university_id_fkey", columns: ["university_id"], isOneToOne: false, referencedRelation: "universities", referencedColumns: ["id"] }
        ];
      };
      jobs: {
        Row: {
          id: string;
          employer_id: string;
          title: string;
          company_name: string;
          company_logo_url: string | null;
          type: "internship" | "full_time" | "part_time" | "contract" | "remote";
          city: string | null;
          is_remote: boolean;
          experience_required: string | null;
          salary_min: number | null;
          salary_max: number | null;
          currency: string;
          preferred_universities: string[];
          required_skills: string[];
          description: string | null;
          apply_method: "email" | "url" | "platform";
          apply_value: string | null;
          deadline: string | null;
          is_featured: boolean;
          status: "active" | "closed" | "removed" | "pending";
          created_at: string;
        };
        Insert: {
          employer_id: string;
          title: string;
          company_name: string;
          type: "internship" | "full_time" | "part_time" | "contract" | "remote";
          apply_method: "email" | "url" | "platform";
          id?: string;
          company_logo_url?: string | null;
          city?: string | null;
          is_remote?: boolean;
          experience_required?: string | null;
          salary_min?: number | null;
          salary_max?: number | null;
          currency?: string;
          preferred_universities?: string[];
          required_skills?: string[];
          description?: string | null;
          apply_value?: string | null;
          deadline?: string | null;
          is_featured?: boolean;
          status?: "active" | "closed" | "removed" | "pending";
        };
        Update: {
          title?: string;
          company_name?: string;
          company_logo_url?: string | null;
          type?: "internship" | "full_time" | "part_time" | "contract" | "remote";
          city?: string | null;
          is_remote?: boolean;
          experience_required?: string | null;
          salary_min?: number | null;
          salary_max?: number | null;
          currency?: string;
          preferred_universities?: string[];
          required_skills?: string[];
          description?: string | null;
          apply_method?: "email" | "url" | "platform";
          apply_value?: string | null;
          deadline?: string | null;
          is_featured?: boolean;
          status?: "active" | "closed" | "removed" | "pending";
        };
        Relationships: [
          { foreignKeyName: "jobs_employer_id_fkey", columns: ["employer_id"], isOneToOne: false, referencedRelation: "profiles", referencedColumns: ["id"] }
        ];
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          applicant_id: string;
          cv_id: string | null;
          cover_note: string | null;
          status: "applied" | "viewed" | "shortlisted" | "rejected" | "hired";
          created_at: string;
        };
        Insert: {
          job_id: string;
          applicant_id: string;
          id?: string;
          cv_id?: string | null;
          cover_note?: string | null;
          status?: "applied" | "viewed" | "shortlisted" | "rejected" | "hired";
        };
        Update: {
          cv_id?: string | null;
          cover_note?: string | null;
          status?: "applied" | "viewed" | "shortlisted" | "rejected" | "hired";
        };
        Relationships: [
          { foreignKeyName: "job_applications_job_id_fkey", columns: ["job_id"], isOneToOne: false, referencedRelation: "jobs", referencedColumns: ["id"] },
          { foreignKeyName: "job_applications_applicant_id_fkey", columns: ["applicant_id"], isOneToOne: false, referencedRelation: "profiles", referencedColumns: ["id"] }
        ];
      };
      cvs: {
        Row: {
          id: string;
          user_id: string;
          file_url: string | null;
          headline: string | null;
          skills: string[];
          preferred_roles: string[];
          preferred_cities: string[];
          availability: string | null;
          visibility: "public" | "employers_only" | "private";
          views: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          id?: string;
          file_url?: string | null;
          headline?: string | null;
          skills?: string[];
          preferred_roles?: string[];
          preferred_cities?: string[];
          availability?: string | null;
          visibility?: "public" | "employers_only" | "private";
          views?: number;
        };
        Update: {
          file_url?: string | null;
          headline?: string | null;
          skills?: string[];
          preferred_roles?: string[];
          preferred_cities?: string[];
          availability?: string | null;
          visibility?: "public" | "employers_only" | "private";
          views?: number;
        };
        Relationships: [
          { foreignKeyName: "cvs_user_id_fkey", columns: ["user_id"], isOneToOne: false, referencedRelation: "profiles", referencedColumns: ["id"] }
        ];
      };
      bookmarks: {
        Row: {
          user_id: string;
          note_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          note_id: string;
        };
        Update: {
          user_id?: string;
          note_id?: string;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          user_id: string;
          note_id: string;
          vote: 1 | -1;
        };
        Insert: {
          user_id: string;
          note_id: string;
          vote: 1 | -1;
        };
        Update: {
          vote?: 1 | -1;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          faculty: string | null;
        };
        Insert: {
          name: string;
          id?: string;
          faculty?: string | null;
        };
        Update: {
          name?: string;
          faculty?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          payload: Record<string, unknown>;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: string;
          id?: string;
          payload?: Record<string, unknown>;
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
          payload?: Record<string, unknown>;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_send_ai_message: {
        Args: { uid: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
