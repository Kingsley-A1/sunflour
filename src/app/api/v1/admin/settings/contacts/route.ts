import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import { readJsonBody } from "@/server/lib/api/request";
import { apiError, apiSuccess } from "@/server/lib/api/response";
import { validateInput } from "@/server/lib/validation/zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CONTACT_KEY = "contact_settings";

const contactsSchema = z.object({
  phoneNumber: z.string().max(50).nullable().optional(),
  whatsappNumber: z.string().max(50).nullable().optional(),
  emailAddress: z.string().max(200).nullable().optional(),
  instagram: z.string().max(200).nullable().optional(),
  tiktok: z.string().max(200).nullable().optional(),
  facebook: z.string().max(200).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
});

export async function GET() {
  try {
    await requireRole(SUPER_ADMIN_ROLES);
    const record = await prisma.siteSetting.findUnique({
      where: { key: CONTACT_KEY },
    });
    return apiSuccess({ contacts: record?.value ?? null });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRole(SUPER_ADMIN_ROLES);
    const input = validateInput(contactsSchema, await readJsonBody(request));

    const settings = {
      phoneNumber: input.phoneNumber ?? null,
      whatsappNumber: input.whatsappNumber ?? null,
      emailAddress: input.emailAddress ?? null,
      instagram: input.instagram ?? null,
      tiktok: input.tiktok ?? null,
      facebook: input.facebook ?? null,
      address: input.address ?? null,
    };

    const record = await prisma.siteSetting.upsert({
      where: { key: CONTACT_KEY },
      create: { key: CONTACT_KEY, value: settings },
      update: { value: settings },
    });

    return apiSuccess({ contacts: record.value });
  } catch (error) {
    return apiError(error);
  }
}
