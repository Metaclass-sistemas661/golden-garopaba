-- Migration para criar a tabela de Configurações do Sistema

CREATE TABLE "SystemSettings" (
  "id" TEXT NOT NULL,
  "companyName" TEXT NOT NULL DEFAULT 'Minha Imobiliária',
  "companyLegalName" TEXT NOT NULL DEFAULT 'Minha Imobiliária LTDA',
  "cnpj" TEXT NOT NULL DEFAULT '',
  "creci" TEXT NOT NULL DEFAULT '',
  "email" TEXT NOT NULL DEFAULT 'contato@imobiliaria.com.br',
  
  "colorPrimary" TEXT NOT NULL DEFAULT '#0f172a',
  "colorSecondary" TEXT NOT NULL DEFAULT '#f8fafc',
  "typography" TEXT NOT NULL DEFAULT 'inter',
  
  "whatsappNumber" TEXT,
  "googleAnalyticsId" TEXT,
  "metaPixelId" TEXT,
  
  "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  "logoUrl" TEXT,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- Inserir o registro único (singleton) com id = 'singleton'
INSERT INTO "SystemSettings" ("id", "updatedAt") 
VALUES ('singleton', CURRENT_TIMESTAMP);
