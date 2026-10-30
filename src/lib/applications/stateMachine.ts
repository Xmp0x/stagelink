export type ApplicationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

// Map of allowed status transitions
export const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "SHORTLISTED", "REJECTED", "WITHDRAWN"],
  UNDER_REVIEW: ["SHORTLISTED", "INTERVIEW", "REJECTED", "WITHDRAWN"],
  SHORTLISTED: ["INTERVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"],
  INTERVIEW: ["ACCEPTED", "REJECTED", "WITHDRAWN"],
  ACCEPTED: [], // Terminal success
  REJECTED: [], // Terminal rejection - non-reversible
  WITHDRAWN: [], // Terminal student cancellation
};

export function isValidStatusTransition(
  currentStatus: ApplicationStatus,
  targetStatus: ApplicationStatus
): boolean {
  if (currentStatus === targetStatus) return true; // Idempotent
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

export function canStudentWithdraw(status: ApplicationStatus): boolean {
  // A student can withdraw if not already in a terminal state
  return ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW"].includes(status);
}
