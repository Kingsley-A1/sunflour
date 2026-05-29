-- AlterEnum
ALTER TYPE "EmailOutboxStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';

-- DropIndex
DROP INDEX IF EXISTS "email_outbox_order_id_template_key_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "email_outbox_order_id_template_key_recipient_email_key" ON "email_outbox"("order_id", "template_key", "recipient_email");
