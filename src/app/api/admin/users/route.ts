import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN"], req);

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const isActiveParam = searchParams.get("isActive");
    const q = searchParams.get("q")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (isActiveParam !== null && isActiveParam !== undefined && isActiveParam !== "") {
      where.isActive = isActiveParam === "true";
    }
    if (q) {
      where.email = { contains: q, mode: "insensitive" };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          createdAt: true,
          studentProfile: {
            select: { firstName: true, lastName: true, city: true },
          },
          companyMemberships: {
            select: {
              role: true,
              company: { select: { id: true, legalName: true, tradeName: true } },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return apiSuccess({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        isEmailVerified: u.isEmailVerified,
        createdAt: u.createdAt.toISOString(),
        profileSummary: u.studentProfile
          ? `${u.studentProfile.firstName} ${u.studentProfile.lastName} (${u.studentProfile.city || "Morocco"})`
          : u.companyMemberships[0]?.company
          ? `${u.companyMemberships[0].company.tradeName || u.companyMemberships[0].company.legalName}`
          : "System Account",
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
