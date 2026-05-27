-- CreateEnum
CREATE TYPE "EmailTemplateKey" AS ENUM ('ORDER_CONFIRMATION', 'PURCHASE_INVOICE', 'AUTH_PASSWORD_RESET', 'ADMIN_NEW_ORDER_ALERT', 'ORDER_STATUS_UPDATE', 'APPRECIATION_AFTER_DELIVERY');

-- CreateEnum
CREATE TYPE "EmailOutboxStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "EmailEventType" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'RETRIED', 'SKIPPED');

-- CreateTable
CREATE TABLE "email_templates" (
    "id" STRING NOT NULL,
    "key" "EmailTemplateKey" NOT NULL,
    "name" STRING NOT NULL,
    "subject" STRING NOT NULL,
    "body_schema_or_component_key" STRING NOT NULL,
    "is_active" BOOL NOT NULL DEFAULT true,
    "updated_by_user_id" STRING,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_outbox" (
    "id" STRING NOT NULL,
    "order_id" STRING,
    "recipient_email" STRING NOT NULL,
    "recipient_name" STRING,
    "template_key" "EmailTemplateKey" NOT NULL,
    "subject_snapshot" STRING NOT NULL,
    "html_snapshot" STRING NOT NULL,
    "payload_json" JSONB NOT NULL,
    "status" "EmailOutboxStatus" NOT NULL DEFAULT 'QUEUED',
    "resend_email_id" STRING,
    "error_message" STRING,
    "attempt_count" INT4 NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_events" (
    "id" STRING NOT NULL,
    "email_outbox_id" STRING NOT NULL,
    "event_type" "EmailEventType" NOT NULL,
    "message" STRING,
    "resend_email_id" STRING,
    "error_message" STRING,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_preferences" (
    "id" STRING NOT NULL,
    "user_id" STRING NOT NULL,
    "transactional_enabled" BOOL NOT NULL DEFAULT true,
    "marketing_enabled" BOOL NOT NULL DEFAULT false,
    "appreciation_enabled" BOOL NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_key_key" ON "email_templates"("key");

-- CreateIndex
CREATE INDEX "email_templates_is_active_idx" ON "email_templates"("is_active");

-- CreateIndex
CREATE INDEX "email_templates_updated_by_user_id_idx" ON "email_templates"("updated_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_outbox_order_id_template_key_key" ON "email_outbox"("order_id", "template_key");

-- CreateIndex
CREATE INDEX "email_outbox_status_next_attempt_at_idx" ON "email_outbox"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "email_outbox_template_key_status_idx" ON "email_outbox"("template_key", "status");

-- CreateIndex
CREATE INDEX "email_outbox_recipient_email_idx" ON "email_outbox"("recipient_email");

-- CreateIndex
CREATE INDEX "email_events_email_outbox_id_created_at_idx" ON "email_events"("email_outbox_id", "created_at");

-- CreateIndex
CREATE INDEX "email_events_event_type_created_at_idx" ON "email_events"("event_type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_preferences_user_id_key" ON "email_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_email_outbox_id_fkey" FOREIGN KEY ("email_outbox_id") REFERENCES "email_outbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_preferences" ADD CONSTRAINT "email_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
