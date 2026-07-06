/*
  Warnings:

  - You are about to drop the column `base_currency` on the `deals` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "deals" DROP COLUMN "base_currency";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "currency";
