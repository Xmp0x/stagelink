import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSession, requireRole } from "./session";
import { prisma } from "../prisma";
import { signSessionToken, SESSION_COOKIE_NAME, type SessionPayload } from "./tokens";

vi.mock("../prisma", () => ({ prisma: { user: { findUnique: vi.fn() } } }));

describe("Session RBAC & Extraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects malformed URI encoding without throwing a server error", async () => {
    const request = new Request("http://localhost/api/auth/me", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=%ZZ` },
    });
    await expect(getSession(request)).resolves.toBeNull();
  });

  it("accepts a session cookie following a semicolon without a space", async () => {
    const token = await signSessionToken({ userId: "u1", email: "test@example.com", role: "STUDENT" });
    const request = new Request("http://localhost/api/auth/me", {
      headers: { cookie: `other=1;${SESSION_COOKIE_NAME}=${token}` },
    });
    expect((await getSession(request))?.userId).toBe("u1");
  });

  it("denies admin access after the database role is downgraded", async () => {
    const token = await signSessionToken({ userId: "u1", email: "test@example.com", role: "ADMIN" });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", isActive: true, role: "STUDENT" } as any);
    const request = new Request("http://localhost/api/admin/users", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    await expect(requireRole(["ADMIN"], request)).rejects.toThrow("FORBIDDEN");
  });

  it("should extract session from Request cookie header correctly", async () => {
    const payload: SessionPayload = {
      userId: "user_test_123",
      email: "student@test.ma",
      role: "STUDENT",
      studentProfileId: "profile_123",
    };

    const token = await signSessionToken(payload);
    const mockRequest = new Request("http://localhost:3000/api/me/profile", {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; other_cookie=xyz`,
      },
    });

    const session = await getSession(mockRequest);
    expect(session).not.toBeNull();
    expect(session?.userId).toBe(payload.userId);
    expect(session?.role).toBe("STUDENT");
  });

  it("should return null when cookie header has no session cookie", async () => {
    const mockRequest = new Request("http://localhost:3000/api/me/profile", {
      headers: {
        cookie: "some_other_cookie=xyz",
      },
    });

    const session = await getSession(mockRequest);
    expect(session).toBeNull();
  });

  it("should return null for corrupted session cookie", async () => {
    const mockRequest = new Request("http://localhost:3000/api/me/profile", {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=invalid_tampered_token`,
      },
    });

    const session = await getSession(mockRequest);
    expect(session).toBeNull();
  });
});
