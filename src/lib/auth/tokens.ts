import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "stagelink_session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionPayload {
  userId: string;
  email: string;
  role: "STUDENT" | "COMPANY" | "ADMIN";
  studentProfileId?: string;
  companyId?: string;
  companyRole?: string;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || "default-insecure-dev-secret-do-not-use-in-prod-32-chars-long";
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (!payload.userId || !payload.email || !payload.role) {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as "STUDENT" | "COMPANY" | "ADMIN",
      studentProfileId: payload.studentProfileId as string | undefined,
      companyId: payload.companyId as string | undefined,
      companyRole: payload.companyRole as string | undefined,
    };
  } catch {
    return null;
  }
}
