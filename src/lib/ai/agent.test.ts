import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { APPROVED_TOOLS, executeApprovedTool } from "./tools";
import { runAgentConversation, SYSTEM_PROMPT } from "./agent";

describe("AI Copilot Tools & Security Registry", () => {
  const dummyContext = {
    studentUserId: "user_test_123",
    studentProfileId: "student_profile_123",
  };

  it("strictly forbids autonomous submission tool in the approved tool registry", () => {
    const submitTool = APPROVED_TOOLS.find((t) => t.name === "submitApplication");
    expect(submitTool).toBeUndefined();
  });

  it("rejects unauthorized or arbitrary tool execution attempts", async () => {
    const result = await executeApprovedTool(
      "submitApplication",
      { listingId: "some-listing-id" },
      dummyContext
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not recognized or permitted/);
  });

  it("rejects arbitrary SQL execution or admin tools", async () => {
    const result = await executeApprovedTool(
      "executeRawSql",
      { query: "SELECT * FROM users" },
      dummyContext
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not recognized or permitted/);
  });
});

describe("AI Copilot Agent Orchestrator & Safety Rules", () => {
  const dummyContext = {
    studentUserId: "user_test_student",
    studentProfileId: "profile_test_student",
  };

  it("contains mandatory security boundaries and submission restrictions in system prompt", () => {
    expect(SYSTEM_PROMPT).toContain("SUBMISSION SAFETY GUARD");
    expect(SYSTEM_PROMPT).toContain("Prompt Injection Defense");
    expect(SYSTEM_PROMPT).toContain("compatibility heuristics, not employment guarantees");
    expect(SYSTEM_PROMPT).toContain("English-only");
  });

  it("returns polite offline notice when AI_ENABLED is set to false", async () => {
    const prevEnv = process.env.AI_ENABLED;
    process.env.AI_ENABLED = "false";

    try {
      const result = await runAgentConversation(
        [{ role: "user", content: "Find me React internships" }],
        dummyContext
      );

      expect(result.content).toMatch(/currently offline for scheduled maintenance/);
      expect(result.toolCallsExecuted).toHaveLength(0);
    } finally {
      process.env.AI_ENABLED = prevEnv;
    }
  });

  it("responds to greeting and introduces capabilities without executing tools", async () => {
    const result = await runAgentConversation(
      [{ role: "user", content: "Hello! Who are you?" }],
      dummyContext
    );

    expect(result.content).toContain("StageLink AI Copilot");
    expect(result.content).toContain("Moroccan students");
  });
});
