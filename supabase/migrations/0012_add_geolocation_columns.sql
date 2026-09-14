-- =============================================================================
-- Migration 0012: Add Geolocation Columns to Property Table
-- =============================================================================
-- IMPORTANT: This migration adds latitude/longitude columns that were defined
-- in the Prisma schema but never migrated to the actual Supabase database.
-- The file prisma/add_geolocation.sql existed but was never placed in
-- supabase/migrations/ and thus never executed.
-- =============================================================================

-- Add latitude column (DOUBLE PRECISION = Float in Prisma)
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;

-- Add longitude column (DOUBLE PRECISION = Float in Prisma)
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- Create composite index for geospatial queries (Enterprise Performance)
-- This index dramatically speeds up queries filtering by coordinates
CREATE INDEX IF NOT EXISTS "Property_lat_lng_idx" ON "Property" ("latitude", "longitude")
  WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL;

-- Create index for properties without coordinates (for batch geocoding queries)
CREATE INDEX IF NOT EXISTS "Property_missing_coords_idx" ON "Property" ("id")
  WHERE "latitude" IS NULL OR "longitude" IS NULL;

-- Log confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 0012: Geolocation columns added successfully';
  RAISE NOTICE '   - latitude (DOUBLE PRECISION, nullable)';
  RAISE NOTICE '   - longitude (DOUBLE PRECISION, nullable)';
  RAISE NOTICE '   - Partial index on (latitude, longitude) WHERE NOT NULL';
  RAISE NOTICE '   - Partial index on (id) WHERE coords IS NULL';
END $$;
