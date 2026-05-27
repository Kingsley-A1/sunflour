import { DeliveryMethod } from "@/generated/prisma/enums";
import { prisma } from "@/server/db/prisma";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit/audit-service";
import {
  calculateDeliveryQuote,
  type DeliveryQuote,
} from "./delivery-calculator";
import {
  requireSlug,
  type DeliveryQuoteRequestInput,
  type DeliverySurchargeRuleCreateInput,
  type DeliverySurchargeRuleUpdateInput,
  type DeliveryZoneCreateInput,
  type DeliveryZoneUpdateInput,
} from "./delivery-schemas";

function notFound(message: string): AppError {
  return new AppError({
    code: ERROR_CODES.NOT_FOUND,
    publicMessage: message,
    status: 404,
  });
}

export async function listPublicDeliveryZones() {
  const zones = await prisma.deliveryZone.findMany({
    where: {
      isActive: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return {
    zones: zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      slug: zone.slug,
      baseFee: zone.baseFee,
    })),
  };
}

export async function getDeliveryQuote(
  input: DeliveryQuoteRequestInput,
  quotedAt = new Date(),
): Promise<DeliveryQuote> {
  if (input.deliveryMethod === DeliveryMethod.PICKUP) {
    return calculateDeliveryQuote({
      deliveryMethod: input.deliveryMethod,
      quotedAt,
    });
  }

  const deliveryZone = await prisma.deliveryZone.findUnique({
    where: {
      id: input.deliveryZoneId,
    },
  });

  const surchargeRules = await prisma.deliverySurchargeRule.findMany({
    where: {
      isActive: true,
    },
  });

  return calculateDeliveryQuote({
    deliveryMethod: input.deliveryMethod,
    deliveryZone,
    surchargeRules,
    quotedAt,
  });
}

export async function listAdminDeliveryZones() {
  return prisma.deliveryZone.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function createDeliveryZone(
  input: DeliveryZoneCreateInput,
  actor: AuthenticatedUser,
) {
  const zone = await prisma.deliveryZone.create({
    data: {
      ...input,
      slug: requireSlug(input),
    },
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "DELIVERY_ZONE_CREATE",
    targetType: "delivery_zone",
    targetId: zone.id,
    metadata: {
      baseFee: zone.baseFee,
    },
  });

  return zone;
}

export async function updateDeliveryZone(
  id: string,
  input: DeliveryZoneUpdateInput,
  actor: AuthenticatedUser,
) {
  const before = await prisma.deliveryZone.findUnique({
    where: { id },
  });

  if (!before) {
    throw notFound("Delivery zone not found.");
  }

  const zone = await prisma.deliveryZone.update({
    where: { id },
    data: {
      ...input,
      slug:
        input.slug ?? (input.name ? requireSlug({ name: input.name }) : undefined),
    },
  });

  if (input.baseFee !== undefined && input.baseFee !== before.baseFee) {
    await writeAuditLog({
      actorUserId: actor.id,
      action: "DELIVERY_FEE_UPDATE",
      targetType: "delivery_zone",
      targetId: id,
      metadata: {
        from: before.baseFee,
        to: input.baseFee,
      },
    });
  }

  await writeAuditLog({
    actorUserId: actor.id,
    action: "DELIVERY_ZONE_UPDATE",
    targetType: "delivery_zone",
    targetId: id,
    metadata: {
      changedFields: Object.keys(input),
    },
  });

  return zone;
}

export async function archiveDeliveryZone(
  id: string,
  actor: AuthenticatedUser,
) {
  const zone = await updateDeliveryZone(id, { isActive: false }, actor);

  await writeAuditLog({
    actorUserId: actor.id,
    action: "DELIVERY_ZONE_ARCHIVE",
    targetType: "delivery_zone",
    targetId: id,
  });

  return zone;
}

export async function listAdminSurchargeRules() {
  return prisma.deliverySurchargeRule.findMany({
    orderBy: [{ isActive: "desc" }, { startsAtTime: "asc" }, { name: "asc" }],
  });
}

export async function createSurchargeRule(
  input: DeliverySurchargeRuleCreateInput,
  actor: AuthenticatedUser,
) {
  const rule = await prisma.deliverySurchargeRule.create({
    data: input,
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "SURCHARGE_RULE_CREATE",
    targetType: "delivery_surcharge_rule",
    targetId: rule.id,
    metadata: {
      amount: rule.amount,
      startsAtTime: rule.startsAtTime,
      endsAtTime: rule.endsAtTime,
    },
  });

  return rule;
}

export async function updateSurchargeRule(
  id: string,
  input: DeliverySurchargeRuleUpdateInput,
  actor: AuthenticatedUser,
) {
  const before = await prisma.deliverySurchargeRule.findUnique({
    where: { id },
  });

  if (!before) {
    throw notFound("Delivery surcharge rule not found.");
  }

  const rule = await prisma.deliverySurchargeRule.update({
    where: { id },
    data: input,
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "SURCHARGE_RULE_UPDATE",
    targetType: "delivery_surcharge_rule",
    targetId: id,
    metadata: {
      before: {
        amount: before.amount,
        startsAtTime: before.startsAtTime,
        endsAtTime: before.endsAtTime,
        isActive: before.isActive,
      },
      after: {
        amount: rule.amount,
        startsAtTime: rule.startsAtTime,
        endsAtTime: rule.endsAtTime,
        isActive: rule.isActive,
      },
    },
  });

  return rule;
}

export async function archiveSurchargeRule(
  id: string,
  actor: AuthenticatedUser,
) {
  return updateSurchargeRule(id, { isActive: false }, actor);
}
