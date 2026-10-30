import { apiSuccess } from "@/lib/utils/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus = "unknown";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch {
    dbStatus = "disconnected";
  }

  return apiSuccess({
    status: "ok",
    app: "StageLink",
    version: "1.0.0",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}
