/*
  Warnings:

  - You are about to drop the column `currency` on the `deals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "deals" DROP COLUMN "currency",
ADD COLUMN     "base_currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "original_currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "original_value" DOUBLE PRECISION NOT NULL DEFAULT 0;
