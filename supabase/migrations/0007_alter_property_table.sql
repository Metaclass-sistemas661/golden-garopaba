-- Altera a tabela existente para remover a coluna antiga e adicionar as novas
ALTER TABLE "Property" 
DROP COLUMN IF EXISTS "amenities",
ADD COLUMN IF NOT EXISTS "features" TEXT[],
ADD COLUMN IF NOT EXISTS "leisure" TEXT[],
ADD COLUMN IF NOT EXISTS "security" TEXT[],
ADD COLUMN IF NOT EXISTS "furniture" TEXT[],
ADD COLUMN IF NOT EXISTS "environments" TEXT[],
ADD COLUMN IF NOT EXISTS "infrastructure" TEXT[],
ADD COLUMN IF NOT EXISTS "rentPrice" DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS "condoPrice" DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS "iptuPrice" DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS "tourLink" TEXT,
ADD COLUMN IF NOT EXISTS "videoLink" TEXT,
ADD COLUMN IF NOT EXISTS "financeable" BOOLEAN DEFAULT false;
