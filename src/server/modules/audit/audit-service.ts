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
