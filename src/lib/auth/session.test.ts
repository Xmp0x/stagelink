import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSession } from "./session";
import { signSessionToken, SESSION_COOKIE_NAME, type SessionPayload } from "./tokens";

describe("Session RBAC & Extraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
