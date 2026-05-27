import { DeliveryMethod } from "@/generated/prisma/enums";
import type { DeliveryMethod as DeliveryMethodValue } from "@/generated/prisma/enums";
import { shouldApplyDeliverySurcharge } from "@/server/lib/date-time/delivery-surcharge";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";

export interface DeliveryZoneForQuote {
  id: string;
  name: string;
  slug: string;
  baseFee: number;
  isActive: boolean;
}

export interface DeliverySurchargeRuleForQuote {
  id: string;
  name: string;
  startsAtTime: string;
  endsAtTime?: string | null;
  amount: number;
  isActive: boolean;
}

export interface AppliedDeliverySurchargeRule {
  id: string;
  name: string;
  amount: number;
  startsAtTime: string;
  endsAtTime: string | null;
}

export interface DeliveryQuote {
  deliveryMethod: DeliveryMethodValue;
  deliveryZone: {
    id: string;
    name: string;
    slug: string;
  } | null;
  baseFee: number;
  surcharge: number;
  totalFee: number;
  appliedSurchargeRules: AppliedDeliverySurchargeRule[];
  quotedAt: string;
}

export interface CalculateDeliveryQuoteInput {
  deliveryMethod: DeliveryMethodValue;
  deliveryZone?: DeliveryZoneForQuote | null;
  surchargeRules?: readonly DeliverySurchargeRuleForQuote[];
  quotedAt?: Date;
  timeZone?: string;
}

function unavailableZoneError(): AppError {
  return new AppError({
    code: ERROR_CODES.DELIVERY_ZONE_UNAVAILABLE,
    publicMessage: "Choose an active delivery zone.",
    status: 400,
    fieldErrors: {
      deliveryZoneId: ["Choose an active delivery zone."],
    },
  });
}

export function calculateDeliveryQuote({
  deliveryMethod,
  deliveryZone,
  surchargeRules = [],
  quotedAt = new Date(),
  timeZone = "Africa/Lagos",
}: CalculateDeliveryQuoteInput): DeliveryQuote {
  if (deliveryMethod === DeliveryMethod.PICKUP) {
    return {
      deliveryMethod,
      deliveryZone: null,
      baseFee: 0,
      surcharge: 0,
      totalFee: 0,
      appliedSurchargeRules: [],
      quotedAt: quotedAt.toISOString(),
    };
  }

  if (!deliveryZone?.isActive) {
    throw unavailableZoneError();
  }

  const appliedSurchargeRules = surchargeRules
    .filter((rule) =>
      shouldApplyDeliverySurcharge({
        deliveryMethod,
        orderedAt: quotedAt,
        timeZone,
        startsAtTime: rule.startsAtTime,
        endsAtTime: rule.endsAtTime,
        isActive: rule.isActive,
      }),
    )
    .map((rule) => ({
      id: rule.id,
      name: rule.name,
      amount: rule.amount,
      startsAtTime: rule.startsAtTime,
      endsAtTime: rule.endsAtTime ?? null,
    }));

  const surcharge = appliedSurchargeRules.reduce(
    (total, rule) => total + rule.amount,
    0,
  );

  return {
    deliveryMethod,
    deliveryZone: {
      id: deliveryZone.id,
      name: deliveryZone.name,
      slug: deliveryZone.slug,
    },
    baseFee: deliveryZone.baseFee,
    surcharge,
    totalFee: deliveryZone.baseFee + surcharge,
    appliedSurchargeRules,
    quotedAt: quotedAt.toISOString(),
  };
}
