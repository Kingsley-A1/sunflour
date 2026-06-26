import type { Prisma } from "@/generated/prisma/client";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import type { ProductDraftInput } from "./product-draft-schemas";

const productDraftSelect = {
  id: true,
  name: true,
  data: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductDraftSelect;

export type ProductDraftRecord = Prisma.ProductDraftGetPayload<{
  select: typeof productDraftSelect;
}>;

function notFound(): AppError {
  return new AppError({
    code: ERROR_CODES.NOT_FOUND,
    publicMessage: "Product draft not found.",
    status: 404,
  });
}

function draftData(input: ProductDraftInput): Prisma.InputJsonValue {
  return input.data as Prisma.InputJsonValue;
}

export async function listProductDrafts(
  actor: AuthenticatedUser,
): Promise<ProductDraftRecord[]> {
  return prisma.productDraft.findMany({
    where: { createdByUserId: actor.id },
    orderBy: { updatedAt: "desc" },
    select: productDraftSelect,
  });
}

export async function countProductDrafts(): Promise<number> {
  return prisma.productDraft.count();
}

export async function getProductDraft(
  id: string,
  actor: AuthenticatedUser,
): Promise<ProductDraftRecord> {
  const draft = await prisma.productDraft.findFirst({
    where: { id, createdByUserId: actor.id },
    select: productDraftSelect,
  });

  if (!draft) {
    throw notFound();
  }

  return draft;
}

export async function createProductDraft(
  input: ProductDraftInput,
  actor: AuthenticatedUser,
): Promise<ProductDraftRecord> {
  return prisma.productDraft.create({
    data: {
      createdByUserId: actor.id,
      name: input.name ?? "",
      data: draftData(input),
    },
    select: productDraftSelect,
  });
}

export async function updateProductDraft(
  id: string,
  input: ProductDraftInput,
  actor: AuthenticatedUser,
): Promise<ProductDraftRecord> {
  const existing = await prisma.productDraft.findFirst({
    where: { id, createdByUserId: actor.id },
    select: { id: true },
  });

  if (!existing) {
    throw notFound();
  }

  return prisma.productDraft.update({
    where: { id },
    data: {
      name: input.name ?? "",
      data: draftData(input),
    },
    select: productDraftSelect,
  });
}

export async function deleteProductDraft(
  id: string,
  actor: AuthenticatedUser,
): Promise<{ id: string }> {
  const existing = await prisma.productDraft.findFirst({
    where: { id, createdByUserId: actor.id },
    select: { id: true },
  });

  if (!existing) {
    throw notFound();
  }

  await prisma.productDraft.delete({ where: { id } });

  return { id };
}
