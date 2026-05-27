-- CreateTable
CREATE TABLE "invoices" (
    "id" STRING NOT NULL,
    "order_id" STRING NOT NULL,
    "invoice_number" STRING NOT NULL,
    "public_access_token" STRING NOT NULL,
    "html_snapshot" STRING NOT NULL,
    "pdf_url" STRING,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_order_id_key" ON "invoices"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_public_access_token_key" ON "invoices"("public_access_token");

-- CreateIndex
CREATE INDEX "invoices_generated_at_idx" ON "invoices"("generated_at");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
