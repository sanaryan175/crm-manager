/*
  Warnings:

  - You are about to drop the column `original_currency` on the `deals` table. All the data in the column will be lost.
  - You are about to drop the column `original_value` on the `deals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "deals" DROP COLUMN "original_currency",
DROP COLUMN "original_value";
