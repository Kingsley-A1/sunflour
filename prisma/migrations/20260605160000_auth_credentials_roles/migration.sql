-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ATTENDANT';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MEDIA_MANAGER';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "password_hash" STRING;
ALTER TABLE "users" ADD COLUMN "password_updated_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "failed_login_count" INT4 NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "locked_until" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_locked_until_idx" ON "users"("locked_until");
