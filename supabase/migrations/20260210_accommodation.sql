-- =====================================================
-- Accommodation Exchange Schema
-- Version: 1.0.0
-- Date: 2026-02-10
-- Adds accommodation listings and inquiries for intern rotation housing
-- =====================================================

-- 1. Accommodation Listings Table
CREATE TABLE IF NOT EXISTS accommodation_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Owner
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Listing details
  title TEXT NOT NULL,
  description TEXT,
  room_type TEXT NOT NULL CHECK (room_type IN ('entire_place', 'private_room', 'shared_room')),
  rent_per_month INTEGER NOT NULL,
  bills_included BOOLEAN DEFAULT false,
  deposit INTEGER,

  -- Location
  address_line TEXT,
  county TEXT NOT NULL,
  eircode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  -- Linked hospital
  hospital_id TEXT NOT NULL,
  hospital_name TEXT NOT NULL,

  -- Availability
  available_from DATE NOT NULL,
  available_to DATE,
  min_lease_months INTEGER DEFAULT 6,

  -- Media & amenities
  photo_urls TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',

  -- Contact
  contact_email TEXT NOT NULL,
  contact_phone TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Accommodation Inquiries Table
CREATE TABLE IF NOT EXISTS accommodation_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES accommodation_listings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_accommodation_active ON accommodation_listings(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_accommodation_county ON accommodation_listings(county) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_accommodation_hospital ON accommodation_listings(hospital_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_accommodation_available_from ON accommodation_listings(available_from) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_accommodation_user ON accommodation_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_inquiries_listing ON accommodation_inquiries(listing_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_inquiries_sender ON accommodation_inquiries(sender_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_accommodation_listings_updated_at ON accommodation_listings;
CREATE TRIGGER update_accommodation_listings_updated_at
  BEFORE UPDATE ON accommodation_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE accommodation_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_inquiries ENABLE ROW LEVEL SECURITY;

-- ========== ACCOMMODATION LISTINGS POLICIES ==========

-- All authenticated users can view active listings
DROP POLICY IF EXISTS "Anyone can view active listings" ON accommodation_listings;
CREATE POLICY "Anyone can view active listings"
  ON accommodation_listings FOR SELECT
  USING (is_active = true);

-- Users can insert their own listings
DROP POLICY IF EXISTS "Users can insert own listings" ON accommodation_listings;
CREATE POLICY "Users can insert own listings"
  ON accommodation_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own listings
DROP POLICY IF EXISTS "Users can update own listings" ON accommodation_listings;
CREATE POLICY "Users can update own listings"
  ON accommodation_listings FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own listings
DROP POLICY IF EXISTS "Users can delete own listings" ON accommodation_listings;
CREATE POLICY "Users can delete own listings"
  ON accommodation_listings FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can manage all listings
DROP POLICY IF EXISTS "Admins can manage all listings" ON accommodation_listings;
CREATE POLICY "Admins can manage all listings"
  ON accommodation_listings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ========== ACCOMMODATION INQUIRIES POLICIES ==========

-- Users can send inquiries
DROP POLICY IF EXISTS "Users can send inquiries" ON accommodation_inquiries;
CREATE POLICY "Users can send inquiries"
  ON accommodation_inquiries FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can view their own sent inquiries
DROP POLICY IF EXISTS "Users can view own inquiries" ON accommodation_inquiries;
CREATE POLICY "Users can view own inquiries"
  ON accommodation_inquiries FOR SELECT
  USING (auth.uid() = sender_id);

-- Listing owners can view inquiries on their listings
DROP POLICY IF EXISTS "Listing owners can view inquiries" ON accommodation_inquiries;
CREATE POLICY "Listing owners can view inquiries"
  ON accommodation_inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM accommodation_listings
      WHERE accommodation_listings.id = listing_id
      AND accommodation_listings.user_id = auth.uid()
    )
  );

-- Admins can view all inquiries
DROP POLICY IF EXISTS "Admins can view all inquiries" ON accommodation_inquiries;
CREATE POLICY "Admins can view all inquiries"
  ON accommodation_inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- =====================================================
-- STORAGE BUCKET
-- =====================================================
-- Note: Storage bucket must be created via Supabase Dashboard or API:
-- Bucket: accommodation-photos
-- Public: true (public read)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE accommodation_listings IS 'Accommodation listings posted by interns for rotation housing exchange';
COMMENT ON TABLE accommodation_inquiries IS 'Inquiries sent by users interested in accommodation listings';
COMMENT ON COLUMN accommodation_listings.hospital_id IS 'References hospital id from hospitals.json';
COMMENT ON COLUMN accommodation_listings.photo_urls IS 'Array of Supabase Storage URLs for listing photos';
COMMENT ON COLUMN accommodation_listings.amenities IS 'Array of amenity tags: furnished, parking, wifi, etc.';
