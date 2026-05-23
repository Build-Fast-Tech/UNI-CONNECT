-- 036_society_and_friends.sql

-- ─── 1. Update society_members schema ──────────────────────────────────
-- Add status column to society_members table
ALTER TABLE public.society_members ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved'));

-- Make sure existing members are approved
UPDATE public.society_members SET status = 'approved';

-- Recreate society_posts insert policy to allow approved members and society admins
DROP POLICY IF EXISTS "society_posts_insert_member" ON public.society_posts;

CREATE POLICY "society_posts_insert_member"
  ON public.society_posts FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.society_members 
        WHERE society_id = society_posts.society_id 
          AND user_id = auth.uid() 
          AND status = 'approved'
      )
      OR EXISTS (
        SELECT 1 FROM public.societies 
        WHERE id = society_posts.society_id 
          AND admin_id = auth.uid()
      )
    )
  );

-- Drop old society_members policies
DROP POLICY IF EXISTS "society_members_update_admin" ON public.society_members;
DROP POLICY IF EXISTS "society_members_delete_own" ON public.society_members;
DROP POLICY IF EXISTS "society_members_delete" ON public.society_members;

-- Create update policy for society_members (society head or admin can approve)
CREATE POLICY "society_members_update_admin"
  ON public.society_members FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.societies s 
      WHERE s.id = society_members.society_id 
        AND (s.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() and role = 'admin'))
    )
  );

-- Create delete policy for society_members (user can leave, or society head/admin can kick/reject)
CREATE POLICY "society_members_delete"
  ON public.society_members FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.societies s 
      WHERE s.id = society_members.society_id 
        AND (s.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() and role = 'admin'))
    )
  );


-- ─── 2. Create Friends and Friend Requests System ──────────────────────────
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Enable RLS on friend_requests
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "friend_requests_select" ON public.friend_requests;
DROP POLICY IF EXISTS "friend_requests_insert" ON public.friend_requests;
DROP POLICY IF EXISTS "friend_requests_update" ON public.friend_requests;
DROP POLICY IF EXISTS "friend_requests_delete" ON public.friend_requests;

-- Create policies for friend_requests
CREATE POLICY "friend_requests_select" 
  ON public.friend_requests FOR SELECT 
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "friend_requests_insert" 
  ON public.friend_requests FOR INSERT 
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "friend_requests_update" 
  ON public.friend_requests FOR UPDATE 
  USING (receiver_id = auth.uid());

CREATE POLICY "friend_requests_delete" 
  ON public.friend_requests FOR DELETE 
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Enable realtime subscriptions for friend_requests
ALTER TABLE public.friend_requests REPLICA IDENTITY FULL;
ALTER TABLE public.society_members REPLICA IDENTITY FULL;

DO $$
BEGIN
  -- Add friend_requests
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'friend_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
  END IF;

  -- Add society_members
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'society_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.society_members;
  END IF;
END $$;

-- ─── 3. Jobs Delete RLS Policy ──────────────────────────────────────────────
DROP POLICY IF EXISTS "jobs_delete_policy" ON public.jobs;
CREATE POLICY "jobs_delete_policy"
  ON public.jobs FOR DELETE
  USING (
    employer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
