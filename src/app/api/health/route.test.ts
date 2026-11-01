import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: vi.fn() } }));

describe("Health endpoint", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 503 when the database is unavailable", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error("Connection refused"));
    const response = await GET();
    expect(response.status).toBe(503);
    expect((await response.json()).data).toMatchObject({ status: "degraded", database: "disconnected" });
  });

  it("returns 200 when the database responds", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ result: 1 }]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect((await response.json()).data).toMatchObject({ status: "ok", database: "connected" });
  });
});
