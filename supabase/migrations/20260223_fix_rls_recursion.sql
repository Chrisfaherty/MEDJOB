-- =====================================================
-- Fix: Infinite Recursion in user_profiles RLS Policies
-- Date: 2026-02-23
--
-- Problem: "Admins can view all profiles" queries user_profiles to check
--          admin status, which re-triggers the same policy → infinite recursion.
--          This breaks any INSERT/SELECT on tables with admin-check policies
--          (accommodation_listings, accommodation_inquiries, user_applications).
--
-- Fix:     Create a SECURITY DEFINER function (runs without RLS) to check
--          admin status. Use it everywhere instead of direct table queries.
-- =====================================================

-- ── 1. Security-definer helper function ───────────────────────────────────────
-- Runs as the function owner (bypasses RLS), so it can safely read user_profiles
-- without triggering a recursive policy evaluation.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- ── 2. Fix user_profiles policies ────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can view all profiles"  ON user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete users"       ON user_profiles;

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete users"
  ON user_profiles FOR DELETE
  USING (is_admin());

-- ── 3. Fix user_applications policies ────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can view all applications" ON user_applications;

CREATE POLICY "Admins can view all applications"
  ON user_applications FOR SELECT
  USING (is_admin());

-- ── 4. Fix accommodation_listings policies ────────────────────────────────────

DROP POLICY IF EXISTS "Admins can manage all listings" ON accommodation_listings;

CREATE POLICY "Admins can manage all listings"
  ON accommodation_listings FOR ALL
  USING (is_admin());

-- ── 5. Fix accommodation_inquiries policies ───────────────────────────────────

DROP POLICY IF EXISTS "Admins can view all inquiries" ON accommodation_inquiries;

CREATE POLICY "Admins can view all inquiries"
  ON accommodation_inquiries FOR SELECT
  USING (is_admin());

-- ── 6. Fix scraping_logs policies ────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can view scraping logs"   ON scraping_logs;
DROP POLICY IF EXISTS "Admins can insert scraping logs" ON scraping_logs;

CREATE POLICY "Admins can view scraping logs"
  ON scraping_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert scraping logs"
  ON scraping_logs FOR INSERT
  WITH CHECK (is_admin());

-- ── 7. Fix jobs policies ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert jobs" ON jobs;
DROP POLICY IF EXISTS "Admins can update jobs" ON jobs;
DROP POLICY IF EXISTS "Admins can delete jobs" ON jobs;

CREATE POLICY "Admins can insert jobs"
  ON jobs FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update jobs"
  ON jobs FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete jobs"
  ON jobs FOR DELETE
  USING (is_admin());
