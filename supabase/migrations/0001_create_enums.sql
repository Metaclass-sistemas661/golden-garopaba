-- Create Enum for Roles
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- Create Enum for Transaction Types (Venda, Aluguel, Lançamento)
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'RENT', 'LANCAMENTO');

-- Create Enum for Property Categories (Residencial, Comercial, Rural)
CREATE TYPE "PropertyCategory" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'RURAL');

-- Create Enum for Property Status
CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'SOLD', 'RENTED');
