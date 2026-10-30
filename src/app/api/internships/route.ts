import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/utils/api";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q")?.trim();
    const city = searchParams.get("city")?.trim();
    const sector = searchParams.get("sector")?.trim();
    const modality = searchParams.get("modality")?.trim();
    const minDuration = searchParams.get("minDuration");
    const maxDuration = searchParams.get("maxDuration");
    const isPaid = searchParams.get("isPaid");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const now = new Date();

    // STRICT VISIBILITY RULES:
    // 1. status = PUBLISHED
    // 2. company.status = VERIFIED
    // 3. deadlineDate >= now
    const where: Prisma.InternshipWhereInput = {
      status: "PUBLISHED",
      deadlineDate: { gte: now },
      company: {
        status: "VERIFIED",
      },
    };

    if (city && city.toLowerCase() !== "all") {
      where.city = { equals: city, mode: "insensitive" };
    }

    if (sector && sector.toLowerCase() !== "all") {
      where.sector = { equals: sector, mode: "insensitive" };
    }

    if (modality && ["REMOTE", "ONSITE", "HYBRID"].includes(modality.toUpperCase())) {
      where.modality = modality.toUpperCase() as "REMOTE" | "ONSITE" | "HYBRID";
    }

    if (isPaid !== null && isPaid !== undefined) {
      if (isPaid === "true") where.isPaid = true;
      if (isPaid === "false") where.isPaid = false;
    }

    if (minDuration || maxDuration) {
      where.durationWeeks = {
        ...(minDuration ? { gte: parseInt(minDuration, 10) } : {}),
        ...(maxDuration ? { lte: parseInt(maxDuration, 10) } : {}),
      };
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
        {
          skills: {
            some: {
              skill: {
                name: { contains: q, mode: "insensitive" },
              },
            },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.internship.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ deadlineDate: "asc" }, { publishedAt: "desc" }],
        include: {
          company: {
            select: {
              id: true,
              legalName: true,
              tradeName: true,
              city: true,
              sector: true,
              logoUrl: true,
              status: true,
            },
          },
          skills: {
            include: { skill: true },
          },
        },
      }),
      prisma.internship.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return apiSuccess({
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
