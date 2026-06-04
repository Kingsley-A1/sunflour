-- CreateTable
CREATE TABLE "homepage_hero_products" (
    "id" STRING NOT NULL,
    "product_id" STRING NOT NULL,
    "sort_order" INT4 NOT NULL DEFAULT 0,
    "is_active" BOOL NOT NULL DEFAULT true,
    "updated_by_user_id" STRING,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_hero_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "homepage_hero_products_product_id_key" ON "homepage_hero_products"("product_id");

-- CreateIndex
CREATE INDEX "homepage_hero_products_is_active_sort_order_idx" ON "homepage_hero_products"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "homepage_hero_products_updated_by_user_id_idx" ON "homepage_hero_products"("updated_by_user_id");

-- AddForeignKey
ALTER TABLE "homepage_hero_products" ADD CONSTRAINT "homepage_hero_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homepage_hero_products" ADD CONSTRAINT "homepage_hero_products_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
