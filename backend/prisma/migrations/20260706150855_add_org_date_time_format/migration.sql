-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "date_format" TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
ADD COLUMN     "time_format" TEXT NOT NULL DEFAULT '24h';
