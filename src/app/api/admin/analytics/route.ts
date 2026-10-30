import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN"], req);

    // Aggregate platform statistics without leaking any student PII
    const [
      totalStudents,
      totalCompanies,
      verifiedCompanies,
      pendingCompanies,
      totalListings,
      publishedListings,
      totalApplications,
      totalMatchesComputed,
    ] = await Promise.all([
      prisma.studentProfile.count(),
      prisma.company.count(),
      prisma.company.count({ where: { status: "VERIFIED" } }),
      prisma.company.count({ where: { status: "PENDING_VERIFICATION" } }),
      prisma.internship.count(),
      prisma.internship.count({ where: { status: "PUBLISHED" } }),
      prisma.application.count(),
      prisma.matchResult.count(),
    ]);

    // Application breakdown by status
    const applicationsByStatus = await prisma.application.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    const statusCounts = applicationsByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    return apiSuccess({
      metrics: {
        students: {
          totalRegistered: totalStudents,
        },
        companies: {
          total: totalCompanies,
          verified: verifiedCompanies,
          pendingVerification: pendingCompanies,
        },
        internships: {
          total: totalListings,
          activePublished: publishedListings,
        },
        applications: {
          totalSubmitted: totalApplications,
          byStatus: statusCounts,
        },
        matching: {
          totalMatchesComputed,
        },
      },
      anonymized: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
