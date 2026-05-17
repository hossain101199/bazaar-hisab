/*
  Warnings:

  - The `type` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `Unit` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('SYSTEM', 'USER');

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "type",
ADD COLUMN     "type" "EntityType" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "Unit" DROP COLUMN "type",
ADD COLUMN     "type" "EntityType" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE INDEX "PurchaseItem_productId_idx" ON "PurchaseItem"("productId");
