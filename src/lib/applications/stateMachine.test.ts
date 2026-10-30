import { describe, it, expect } from "vitest";
import { isValidStatusTransition, canStudentWithdraw } from "./stateMachine";

describe("Application State Machine Transitions", () => {
  it("allows valid forward transitions from SUBMITTED", () => {
    expect(isValidStatusTransition("SUBMITTED", "UNDER_REVIEW")).toBe(true);
    expect(isValidStatusTransition("SUBMITTED", "SHORTLISTED")).toBe(true);
    expect(isValidStatusTransition("SUBMITTED", "REJECTED")).toBe(true);
    expect(isValidStatusTransition("SUBMITTED", "WITHDRAWN")).toBe(true);
  });

  it("allows progression from SHORTLISTED to INTERVIEW or ACCEPTED", () => {
    expect(isValidStatusTransition("SHORTLISTED", "INTERVIEW")).toBe(true);
    expect(isValidStatusTransition("SHORTLISTED", "ACCEPTED")).toBe(true);
  });

  it("strictly forbids reversing or mutating from terminal states (REJECTED, WITHDRAWN, ACCEPTED)", () => {
    expect(isValidStatusTransition("REJECTED", "SUBMITTED")).toBe(false);
    expect(isValidStatusTransition("REJECTED", "ACCEPTED")).toBe(false);
    expect(isValidStatusTransition("WITHDRAWN", "UNDER_REVIEW")).toBe(false);
    expect(isValidStatusTransition("ACCEPTED", "SUBMITTED")).toBe(false);
  });

  it("checks student withdrawal eligibility", () => {
    expect(canStudentWithdraw("SUBMITTED")).toBe(true);
    expect(canStudentWithdraw("UNDER_REVIEW")).toBe(true);
    expect(canStudentWithdraw("INTERVIEW")).toBe(true);
    expect(canStudentWithdraw("REJECTED")).toBe(false);
    expect(canStudentWithdraw("WITHDRAWN")).toBe(false);
    expect(canStudentWithdraw("ACCEPTED")).toBe(false);
  });
});
