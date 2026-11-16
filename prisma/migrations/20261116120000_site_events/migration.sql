-- CreateTable
CREATE TABLE "site_events" (
    "id" STRING NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitor_id" STRING NOT NULL,
    "session_id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "path" STRING NOT NULL,
    "source" STRING NOT NULL,
    "referrer_host" STRING,
    "utm_campaign" STRING,
    "device_type" STRING NOT NULL,
    "browser" STRING,
    "os" STRING,
    "product_id" STRING,
    "product_slug" STRING,
    "order_number" STRING,
    "value_kobo" INT4,
    "label" STRING,
    "metadata" JSONB,

    CONSTRAINT "site_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_events_occurred_at_idx" ON "site_events"("occurred_at");

-- CreateIndex
CREATE INDEX "site_events_name_occurred_at_idx" ON "site_events"("name", "occurred_at");

-- CreateIndex
CREATE INDEX "site_events_session_id_occurred_at_idx" ON "site_events"("session_id", "occurred_at");

-- CreateIndex
CREATE INDEX "site_events_product_id_name_idx" ON "site_events"("product_id", "name");
