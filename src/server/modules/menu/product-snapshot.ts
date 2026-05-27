export interface CatalogProductSnapshotInput {
  productName: string;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
}

export interface CatalogLineItemSnapshot {
  productNameSnapshot: string;
  variantNameSnapshot: string | null;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
}

export function buildCatalogLineItemSnapshot(
  input: CatalogProductSnapshotInput,
): CatalogLineItemSnapshot {
  return {
    productNameSnapshot: input.productName,
    variantNameSnapshot: input.variantName ?? null,
    unitPriceSnapshot: input.unitPrice,
    quantity: input.quantity,
    lineTotal: input.unitPrice * input.quantity,
  };
}
