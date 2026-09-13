CREATE TABLE "PropertyTransaction" (
    "id" TEXT NOT NULL,
    "propertyId" UUID NOT NULL,
    "brokerId" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "commissionAmount" DECIMAL(15,2) NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PropertyTransaction_propertyId_idx" ON "PropertyTransaction"("propertyId");
CREATE INDEX "PropertyTransaction_brokerId_idx" ON "PropertyTransaction"("brokerId");
CREATE INDEX "PropertyTransaction_transactionDate_idx" ON "PropertyTransaction"("transactionDate");

ALTER TABLE "PropertyTransaction" ADD CONSTRAINT "PropertyTransaction_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyTransaction" ADD CONSTRAINT "PropertyTransaction_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
