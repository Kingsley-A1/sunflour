import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

export interface AuditLogInput {
  actorUserId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

export interface AuditLogData {
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata?: Prisma.InputJsonValue;
}

export interface AuditLogRepository {
  create(input: { data: AuditLogData }): Promise<unknown>;
}

export interface AuditLogClient {
  auditLog: AuditLogRepository;
}

export interface AuditLogListInput {
  actorUserId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  createdFrom?: Date;
  createdTo?: Date;
  page: number;
  pageSize: number;
}

export function buildAuditLogData(input: AuditLogInput): AuditLogData {
  return {
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    metadata: input.metadata,
  };
}

export async function writeAuditLog(
  input: AuditLogInput,
  client: AuditLogClient = prisma,
): Promise<unknown> {
  return client.auditLog.create({
    data: buildAuditLogData(input),
  });
}

function isSensitiveMetadataKey(key: string): boolean {
  const normalized = key.toLowerCase();

  return (
    normalized.includes("secret") ||
    normalized.includes("password") ||
    normalized.includes("token") ||
    normalized.includes("credential") ||
    normalized.includes("accountnumber") ||
    normalized.includes("paymentinstruction") ||
    normalized.includes("proofwhatsappnumber")
  );
}

export function sanitizeAuditMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditMetadata(item));
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      isSensitiveMetadataKey(key) && key !== "accountNumberLast4"
        ? "[redacted]"
        : sanitizeAuditMetadata(nestedValue),
    ]),
  );
}

function buildAuditLogWhere(input: AuditLogListInput): Prisma.AuditLogWhereInput {
  return {
    actorUserId: input.actorUserId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    createdAt:
      input.createdFrom || input.createdTo
        ? {
            gte: input.createdFrom,
            lte: input.createdTo,
          }
        : undefined,
  };
}

export async function listAuditLogsForAdmin(input: AuditLogListInput) {
  const where = buildAuditLogWhere(input);
  const skip = (input.page - 1) * input.pageSize;
  const [total, auditLogs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: input.pageSize,
      select: {
        id: true,
        actorUserId: true,
        action: true,
        targetType: true,
        targetId: true,
        metadata: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ]);

  return {
    auditLogs: auditLogs.map((auditLog) => ({
      ...auditLog,
      metadata: sanitizeAuditMetadata(auditLog.metadata),
    })),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      pageCount: Math.ceil(total / input.pageSize),
    },
  };
}
