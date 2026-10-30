import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/passwords";
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth/tokens";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";

const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const normalizedEmail = data.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        studentProfile: { select: { id: true } },
        companyMemberships: { select: { companyId: true, role: true }, take: 1 },
      },
    });

    if (!user || !user.isActive) {
      return apiError("Invalid email address or password.", "INVALID_CREDENTIALS", 401);
    }

    const isPasswordValid = await verifyPassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      return apiError("Invalid email address or password.", "INVALID_CREDENTIALS", 401);
    }

    const studentProfileId = user.studentProfile?.id;
    const primaryMembership = user.companyMemberships[0];

    // Sign session token
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      studentProfileId,
      companyId: primaryMembership?.companyId,
      companyRole: primaryMembership?.role,
    });

    let redirectUrl = "/";
    if (user.role === "STUDENT") {
      redirectUrl = "/student/dashboard";
    } else if (user.role === "COMPANY") {
      redirectUrl = "/company/dashboard";
    } else if (user.role === "ADMIN") {
      redirectUrl = "/admin";
    }

    // Record login audit event
    await prisma.auditEvent.create({
      data: {
        actorUserId: user.id,
        action: "USER_LOGGED_IN",
        targetType: "User",
        targetId: user.id,
      },
    });

    const response = apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        studentProfileId,
        companyId: primaryMembership?.companyId,
      },
      redirectUrl,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
