-- Migration para adicionar comissões separadas de venda e aluguel para corretores

-- 1. Adicionar as novas colunas
ALTER TABLE "Broker" ADD COLUMN "commissionPercentageSale" DECIMAL(5, 2);
ALTER TABLE "Broker" ADD COLUMN "commissionPercentageRent" DECIMAL(5, 2);

-- 2. Copiar os dados existentes da comissão antiga para as novas colunas
UPDATE "Broker" SET "commissionPercentageSale" = "commissionPercentage", "commissionPercentageRent" = "commissionPercentage";

-- 3. Garantir que as colunas não sejam nulas para futuros registros (se desejado, no prisma já faremos o required)
ALTER TABLE "Broker" ALTER COLUMN "commissionPercentageSale" SET NOT NULL;
ALTER TABLE "Broker" ALTER COLUMN "commissionPercentageRent" SET NOT NULL;

-- 4. Remover a coluna antiga
ALTER TABLE "Broker" DROP COLUMN "commissionPercentage";
