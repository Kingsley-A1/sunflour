-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'HIDDEN', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "MediaAssetStatus" AS ENUM ('PENDING_UPLOAD', 'READY', 'DELETED');

-- CreateEnum
CREATE TYPE "MediaUploadPurpose" AS ENUM ('PRODUCT_IMAGE');

-- CreateTable
CREATE TABLE "categories" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "description" STRING,
    "sort_order" INT4 NOT NULL DEFAULT 0,
    "is_active" BOOL NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" STRING NOT NULL,
    "category_id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "description" STRING,
    "base_price" INT4 NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "show_when_out_of_stock" BOOL NOT NULL DEFAULT true,
    "is_featured" BOOL NOT NULL DEFAULT false,
    "is_popular" BOOL NOT NULL DEFAULT false,
    "sort_order" INT4 NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" STRING NOT NULL,
    "product_id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "price" INT4 NOT NULL,
    "sku" STRING,
    "is_active" BOOL NOT NULL DEFAULT true,
    "sort_order" INT4 NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" STRING NOT NULL,
    "bucket" STRING NOT NULL,
    "object_key" STRING NOT NULL,
    "public_url" STRING,
    "original_filename" STRING NOT NULL,
    "content_type" STRING NOT NULL,
    "byte_size" INT4 NOT NULL,
    "upload_purpose" "MediaUploadPurpose" NOT NULL,
    "status" "MediaAssetStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "created_by_user_id" STRING,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" STRING NOT NULL,
    "product_id" STRING NOT NULL,
    "media_asset_id" STRING NOT NULL,
    "alt_text" STRING,
    "is_primary" BOOL NOT NULL DEFAULT false,
    "sort_order" INT4 NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_is_active_sort_order_idx" ON "categories"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_status_sort_order_idx" ON "products"("status", "sort_order");

-- CreateIndex
CREATE INDEX "products_is_featured_idx" ON "products"("is_featured");

-- CreateIndex
CREATE INDEX "products_is_popular_idx" ON "products"("is_popular");

-- CreateIndex
CREATE INDEX "product_variants_product_id_is_active_sort_order_idx" ON "product_variants"("product_id", "is_active", "sort_order");

-- CreateIndex
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_object_key_key" ON "media_assets"("object_key");

-- CreateIndex
CREATE INDEX "media_assets_status_idx" ON "media_assets"("status");

-- CreateIndex
CREATE INDEX "media_assets_upload_purpose_idx" ON "media_assets"("upload_purpose");

-- CreateIndex
CREATE INDEX "media_assets_created_by_user_id_idx" ON "media_assets"("created_by_user_id");

-- CreateIndex
CREATE INDEX "product_images_product_id_is_primary_sort_order_idx" ON "product_images"("product_id", "is_primary", "sort_order");

-- CreateIndex
CREATE INDEX "product_images_media_asset_id_idx" ON "product_images"("media_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_product_id_media_asset_id_key" ON "product_images"("product_id", "media_asset_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
