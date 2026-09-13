CREATE TYPE "BrokerStatus" AS ENUM ('ACTIVE', 'VACATION', 'INACTIVE');

CREATE TABLE "Broker" (
    "id" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "fullName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "creci" TEXT NOT NULL,
    "document" TEXT,
    "birthDate" TIMESTAMP(3),
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "phoneAlt" TEXT,
    "address" TEXT,
    "specialty" TEXT NOT NULL,
    "commissionPercentage" DECIMAL(5,2) NOT NULL,
    "salesGoalQuarterly" DECIMAL(15,2),
    "status" "BrokerStatus" NOT NULL DEFAULT 'ACTIVE',
    "hiredAt" TIMESTAMP(3),
    "instagramUrl" TEXT,
    "linkedinUrl" TEXT,
    "youtubeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Broker_pkey" PRIMARY KEY ("id")
);
