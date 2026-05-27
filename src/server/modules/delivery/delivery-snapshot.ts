import { DeliveryMethod } from "@/generated/prisma/enums";
import type { DeliveryQuote } from "./delivery-calculator";

export interface DeliveryFeeSnapshot {
  deliveryMethod: DeliveryMethod;
  deliveryZoneIdSnapshot: string | null;
  deliveryZoneNameSnapshot: string | null;
  deliveryBaseFeeSnapshot: number;
  deliverySurchargeSnapshot: number;
  deliveryTotalFeeSnapshot: number;
}

export function buildDeliveryFeeSnapshot(
  quote: DeliveryQuote,
): DeliveryFeeSnapshot {
  return {
    deliveryMethod: quote.deliveryMethod,
    deliveryZoneIdSnapshot: quote.deliveryZone?.id ?? null,
    deliveryZoneNameSnapshot: quote.deliveryZone?.name ?? null,
    deliveryBaseFeeSnapshot: quote.baseFee,
    deliverySurchargeSnapshot: quote.surcharge,
    deliveryTotalFeeSnapshot: quote.totalFee,
  };
}
