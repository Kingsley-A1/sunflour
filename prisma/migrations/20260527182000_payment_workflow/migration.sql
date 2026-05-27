-- AlterTable
ALTER TABLE "orders" ADD COLUMN "proof_whatsapp_number_snapshot" STRING;

-- CreateTable
CREATE TABLE "payment_settings" (
    "id" STRING NOT NULL,
    "setting_key" STRING NOT NULL DEFAULT 'default',
    "bank_name" STRING NOT NULL,
    "account_name" STRING NOT NULL,
    "account_number" STRING NOT NULL,
    "payment_instruction" STRING NOT NULL,
    "proof_whatsapp_number" STRING NOT NULL,
    "is_active" BOOL NOT NULL DEFAULT true,
    "updated_by_user_id" STRING,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_confirmation_events" (
    "id" STRING NOT NULL,
    "order_id" STRING NOT NULL,
    "from_status" "PaymentStatus" NOT NULL,
    "to_status" "PaymentStatus" NOT NULL,
    "changed_by_user_id" STRING,
    "reason" STRING,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_confirmation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_settings_setting_key_key" ON "payment_settings"("setting_key");

-- CreateIndex
CREATE INDEX "payment_settings_is_active_idx" ON "payment_settings"("is_active");

-- CreateIndex
CREATE INDEX "payment_settings_updated_by_user_id_idx" ON "payment_settings"("updated_by_user_id");

-- CreateIndex
CREATE INDEX "payment_confirmation_events_order_id_created_at_idx" ON "payment_confirmation_events"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "payment_confirmation_events_to_status_created_at_idx" ON "payment_confirmation_events"("to_status", "created_at");

-- CreateIndex
CREATE INDEX "payment_confirmation_events_changed_by_user_id_idx" ON "payment_confirmation_events"("changed_by_user_id");

-- AddForeignKey
ALTER TABLE "payment_settings" ADD CONSTRAINT "payment_settings_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_confirmation_events" ADD CONSTRAINT "payment_confirmation_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_confirmation_events" ADD CONSTRAINT "payment_confirmation_events_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
