-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateTable
CREATE TABLE "delivery_zones" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "base_fee" INT4 NOT NULL,
    "is_active" BOOL NOT NULL DEFAULT true,
    "sort_order" INT4 NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_surcharge_rules" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "starts_at_time" STRING NOT NULL,
    "ends_at_time" STRING,
    "amount" INT4 NOT NULL,
    "is_active" BOOL NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_surcharge_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_zones_slug_key" ON "delivery_zones"("slug");

-- CreateIndex
CREATE INDEX "delivery_zones_is_active_sort_order_idx" ON "delivery_zones"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "delivery_surcharge_rules_is_active_starts_at_time_idx" ON "delivery_surcharge_rules"("is_active", "starts_at_time");
