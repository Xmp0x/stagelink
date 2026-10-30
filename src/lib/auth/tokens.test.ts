import { describe, it, expect } from "vitest";
import { signSessionToken, verifySessionToken, type SessionPayload } from "./tokens";

describe("JWT Session Tokens", () => {
  it("should sign and verify a student session payload", async () => {
    const payload: SessionPayload = {
      userId: "usr_student_123",
      email: "student@test.ma",
      role: "STUDENT",
      studentProfileId: "prof_student_123",
    };

    const token = await signSessionToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.role).toBe("STUDENT");
    expect(verified?.studentProfileId).toBe(payload.studentProfileId);
  });

  it("should sign and verify a company session payload", async () => {
    const payload: SessionPayload = {
      userId: "usr_company_456",
      email: "recruiter@tangiertech.ma",
      role: "COMPANY",
      companyId: "cmp_tangier_tech",
      companyRole: "OWNER",
    };

    const token = await signSessionToken(payload);
    const verified = await verifySessionToken(token);

    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.role).toBe("COMPANY");
    expect(verified?.companyId).toBe(payload.companyId);
    expect(verified?.companyRole).toBe(payload.companyRole);
  });

  it("should return null for an invalid or tampered token", async () => {
    const validToken = await signSessionToken({
      userId: "usr_1",
      email: "u1@test.ma",
      role: "STUDENT",
    });

    const tampered = validToken.substring(0, validToken.length - 5) + "abcde";
    const verified = await verifySessionToken(tampered);
    expect(verified).toBeNull();
  });
});
