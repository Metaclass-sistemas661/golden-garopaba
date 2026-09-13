-- Create Property Table
CREATE TABLE "Property" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "category" "PropertyCategory" NOT NULL,
    "propertyType" TEXT NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'AVAILABLE'::"PropertyStatus",
    
    "location" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    
    "bedrooms" INTEGER NOT NULL DEFAULT 0,
    "suites" INTEGER NOT NULL DEFAULT 0,
    "bathrooms" INTEGER NOT NULL DEFAULT 0,
    "parkingSpaces" INTEGER NOT NULL DEFAULT 0,
    
    "areaTotal" DECIMAL(10,2),
    "areaUseful" DECIMAL(10,2),
    
    "features" TEXT[],
    "leisure" TEXT[],
    "security" TEXT[],
    "furniture" TEXT[],
    "environments" TEXT[],
    "infrastructure" TEXT[],
    "photos" TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- Create Unique Index for Property Code
CREATE UNIQUE INDEX "Property_code_key" ON "Property"("code");

-- Create Indexes for filtering performance
CREATE INDEX "Property_transactionType_idx" ON "Property"("transactionType");
CREATE INDEX "Property_category_idx" ON "Property"("category");
CREATE INDEX "Property_price_idx" ON "Property"("price");
