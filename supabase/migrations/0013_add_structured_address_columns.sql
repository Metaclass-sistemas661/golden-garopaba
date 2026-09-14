-- =============================================================================
-- Migration 0013: Add Structured Address Columns to Property Table
-- =============================================================================
-- This migration adds structured address fields (street, number, complement,
-- neighborhood) that were missing. The columns city, state, zipCode already
-- exist in the schema but were not being utilized by the form.
-- Now the form will use all structured fields with CEP auto-fill.
-- =============================================================================

-- Add street column (Logradouro/Rua)
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "street" TEXT;

-- Add number column (Número)
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "number" TEXT;

-- Add complement column (Complemento - Apto, Bloco, etc.)
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "complement" TEXT;

-- Add neighborhood column (Bairro)
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "neighborhood" TEXT;

-- =============================================================================
-- ENTERPRISE: Performance Indexes for Address-Based Filtering
-- =============================================================================
-- These indexes support fast filtering by city, neighborhood and state,
-- which are common search/filter patterns in real estate applications.

-- Index on city — most common filter ("imóveis em Garopaba")
CREATE INDEX IF NOT EXISTS "Property_city_idx"
  ON "Property" ("city")
  WHERE "city" IS NOT NULL;

-- Index on neighborhood — filter by bairro
CREATE INDEX IF NOT EXISTS "Property_neighborhood_idx"
  ON "Property" ("neighborhood")
  WHERE "neighborhood" IS NOT NULL;

-- Index on state — filter by UF
CREATE INDEX IF NOT EXISTS "Property_state_idx"
  ON "Property" ("state")
  WHERE "state" IS NOT NULL;

-- Composite index for the most common combined filter: city + transactionType
-- e.g. "Apartamentos à venda em Florianópolis"
CREATE INDEX IF NOT EXISTS "Property_city_transactionType_idx"
  ON "Property" ("city", "transactionType")
  WHERE "city" IS NOT NULL;

-- Composite index for city + status (only show available properties in city)
CREATE INDEX IF NOT EXISTS "Property_city_status_idx"
  ON "Property" ("city", "status")
  WHERE "city" IS NOT NULL;

-- Index on zipCode for exact CEP lookup / deduplication
CREATE INDEX IF NOT EXISTS "Property_zipCode_idx"
  ON "Property" ("zipCode")
  WHERE "zipCode" IS NOT NULL;

-- =============================================================================
-- Log confirmation
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 0013: Structured address columns + indexes applied';
  RAISE NOTICE '   Columns added:';
  RAISE NOTICE '   - street (TEXT, nullable)';
  RAISE NOTICE '   - number (TEXT, nullable)';
  RAISE NOTICE '   - complement (TEXT, nullable)';
  RAISE NOTICE '   - neighborhood (TEXT, nullable)';
  RAISE NOTICE '   Note: city, state, zipCode already existed in schema';
  RAISE NOTICE '   Indexes created:';
  RAISE NOTICE '   - Property_city_idx (partial, city IS NOT NULL)';
  RAISE NOTICE '   - Property_neighborhood_idx (partial, neighborhood IS NOT NULL)';
  RAISE NOTICE '   - Property_state_idx (partial, state IS NOT NULL)';
  RAISE NOTICE '   - Property_city_transactionType_idx (composite)';
  RAISE NOTICE '   - Property_city_status_idx (composite)';
  RAISE NOTICE '   - Property_zipCode_idx (partial, zipCode IS NOT NULL)';
END $$;
