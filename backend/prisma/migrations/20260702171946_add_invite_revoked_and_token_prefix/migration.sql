-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'invite_revoked';

-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "token_prefix" TEXT;

-- CreateIndex
CREATE INDEX "invitations_token_prefix_status_idx" ON "invitations"("token_prefix", "status");
