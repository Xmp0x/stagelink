import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken, type SessionPayload } from "./tokens";
import { prisma } from "../prisma";

/**
 * Extracts and verifies the current session from incoming request headers or Next.js cookies
 */
export async function getSession(req?: Request): Promise<SessionPayload | null> {
  let token: string | undefined;

  // 1. Try reading from Request Cookie header if provided
  if (req) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }
  }

  // 2. Fall back to Next.js cookies() helper (for Server Components / Route Handlers)
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // In non-request contexts or early middleware, cookies() may throw
    }
  }

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

/**
 * Ensures caller is authenticated; throws 401 Unauthorized if not
 */
export async function requireUser(req?: Request): Promise<SessionPayload> {
  const session = await getSession(req);
  if (!session) {
    throw new Error("UNAUTHORIZED: Authentication required.");
  }

  // Verify that the user still exists and is active in the database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, isActive: true, role: true },
  });

  if (!user || !user.isActive) {
    throw new Error("UNAUTHORIZED: Account is deactivated or does not exist.");
  }

  return session;
}

/**
 * Ensures caller has one of the allowed roles; throws 403 Forbidden if not
 */
export async function requireRole(
  allowedRoles: ("STUDENT" | "COMPANY" | "ADMIN")[],
  req?: Request
): Promise<SessionPayload> {
  const session = await requireUser(req);
  if (!allowedRoles.includes(session.role)) {
    throw new Error(`FORBIDDEN: Insufficient permissions. Required role: ${allowedRoles.join(" or ")}.`);
  }
  return session;
}

/**
 * Validates that the caller is an authorized member of a specific company
 */
export async function requireCompanyMembership(
  companyId: string,
  req?: Request
): Promise<{ session: SessionPayload; role: string }> {
  const session = await requireRole(["COMPANY", "ADMIN"], req);

  // Platform admins have supervisory access
  if (session.role === "ADMIN") {
    return { session, role: "SUPER_ADMIN" };
  }

  const membership = await prisma.companyMembership.findUnique({
    where: {
      companyId_userId: {
        companyId,
        userId: session.userId,
      },
    },
  });

  if (!membership) {
    throw new Error("FORBIDDEN: You do not have access to this organization.");
  }

  return { session, role: membership.role };
}
