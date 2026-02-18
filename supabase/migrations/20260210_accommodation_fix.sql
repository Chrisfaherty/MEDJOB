-- =====================================================
-- Accommodation Fix Migration
-- Fixes FK relationships for PostgREST joins and RLS for listing owners
-- =====================================================

-- 1. Fix FK: accommodation_listings.user_id should reference user_profiles(id)
--    so PostgREST can detect the relationship for select('*, user_profiles(name)')
ALTER TABLE accommodation_listings DROP CONSTRAINT IF EXISTS accommodation_listings_user_id_fkey;
ALTER TABLE accommodation_listings
  ADD CONSTRAINT accommodation_listings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- 2. Fix FK: accommodation_inquiries.sender_id should reference user_profiles(id)
ALTER TABLE accommodation_inquiries DROP CONSTRAINT IF EXISTS accommodation_inquiries_sender_id_fkey;
ALTER TABLE accommodation_inquiries
  ADD CONSTRAINT accommodation_inquiries_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- 3. Allow listing owners to see their own listings (including inactive)
DROP POLICY IF EXISTS "Owners can view own listings" ON accommodation_listings;
CREATE POLICY "Owners can view own listings"
  ON accommodation_listings FOR SELECT
  USING (auth.uid() = user_id);
