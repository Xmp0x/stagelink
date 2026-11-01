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
    status: dbStatus === "connected" ? "ok" : "degraded",
    app: "StageLink",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    database: dbStatus,
    aiProvider: process.env.AI_PROVIDER || "mock",
    storageProvider: process.env.STORAGE_PROVIDER || "local",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  }, dbStatus === "connected" ? 200 : 503);
}
