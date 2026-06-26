-- CreateTable
CREATE TABLE "product_drafts" (
    "id" STRING NOT NULL,
    "created_by_user_id" STRING NOT NULL,
    "name" STRING NOT NULL DEFAULT '',
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_drafts_created_by_user_id_updated_at_idx" ON "product_drafts"("created_by_user_id", "updated_at");

-- AddForeignKey
ALTER TABLE "product_drafts" ADD CONSTRAINT "product_drafts_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
