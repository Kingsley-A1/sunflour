import { prisma } from "@/server/db/prisma";

export async function listAdminUsersForSuperAdmin() {
  return prisma.adminProfile.findMany({
    orderBy: [
      {
        role: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          lastLoginAt: true,
        },
      },
    },
  });
}
