import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, validatePasswordStrength } from "./passwords";

describe("Password Utility", () => {
  it("should hash a valid password and verify correctly", async () => {
    const raw = "SecurePass123!";
    const hash = await hashPassword(raw);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(raw);

    const isValid = await verifyPassword(raw, hash);
    expect(isValid).toBe(true);

    const isWrongValid = await verifyPassword("WrongPassword123!", hash);
    expect(isWrongValid).toBe(false);
  });

  it("should reject passwords that are too short", async () => {
    await expect(hashPassword("short1")).rejects.toThrow("at least 8 characters");
  });

  it("should validate password strength rules", () => {
    expect(validatePasswordStrength("short").isValid).toBe(false);
    expect(validatePasswordStrength("alllettersonly").isValid).toBe(false);
    expect(validatePasswordStrength("12345678").isValid).toBe(false);
    expect(validatePasswordStrength("ValidPassword1").isValid).toBe(true);
  });
});
