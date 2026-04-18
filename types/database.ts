// Auto-generated types will go here after running: supabase gen types typescript
// For now, using a placeholder to satisfy TypeScript

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
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          full_name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
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
        };
        Insert: Partial<Database["public"]["Tables"]["universities"]["Row"]> & {
          name: string;
          short_name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["universities"]["Row"]>;
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
        Insert: Partial<Database["public"]["Tables"]["branches"]["Row"]> & {
          university_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["branches"]["Row"]>;
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
          upvotes: number;
          downvotes: number;
          downloads: number;
          status: "published" | "flagged" | "removed";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notes"]["Row"]> & {
          uploader_id: string;
          title: string;
          subject: string;
          file_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["notes"]["Row"]>;
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
        Insert: Partial<Database["public"]["Tables"]["channels"]["Row"]> & {
          type: "global" | "university" | "branch" | "dm";
        };
        Update: Partial<Database["public"]["Tables"]["channels"]["Row"]>;
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
        Insert: Partial<Database["public"]["Tables"]["messages"]["Row"]> & {
          channel_id: string;
          sender_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Row"]>;
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
        Insert: Partial<Database["public"]["Tables"]["jobs"]["Row"]> & {
          employer_id: string;
          title: string;
          company_name: string;
          type: "internship" | "full_time" | "part_time" | "contract" | "remote";
        };
        Update: Partial<Database["public"]["Tables"]["jobs"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      can_send_ai_message: {
        Args: { uid: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
};
