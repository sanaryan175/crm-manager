-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "address" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "date_format" TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
ADD COLUMN     "job_title" TEXT,
ADD COLUMN     "meeting_reminders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "time_format" TEXT NOT NULL DEFAULT '12h';
