-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reset_pin" TEXT,
ADD COLUMN     "reset_pin_expires" TIMESTAMP(3);
