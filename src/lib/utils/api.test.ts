import { describe, it, expect } from "vitest";
import { apiSuccess, apiError, handleApiError } from "./api";
import { z } from "zod";

describe("API Response Utilities", () => {
  it("should format apiSuccess with standard envelope", async () => {
    const res = apiSuccess({ hello: "world" }, 200);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ hello: "world" });
    expect(body.correlationId).toMatch(/^req_/);
    expect(body.timestamp).toBeDefined();
  });

  it("should format apiError with standard error code and message", async () => {
    const res = apiError("Invalid credentials", "UNAUTHORIZED", 401);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(body.error.message).toBe("Invalid credentials");
    expect(body.correlationId).toMatch(/^req_/);
  });

  it("should handle ZodError gracefully with field details", async () => {
    const testSchema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
    });

    try {
      testSchema.parse({ email: "invalid-email", age: 10 });
    } catch (err) {
      const res = handleApiError(err);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_FAILED");
      expect(body.error.details.length).toBe(2);
      expect(body.error.details[0].field).toBe("email");
      expect(body.error.details[1].field).toBe("age");
    }
  });
});
