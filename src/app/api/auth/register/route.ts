import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/passwords";
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth/tokens";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";

const registerSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  role: z.enum(["STUDENT", "COMPANY"], {
    errorMap: () => ({ message: "Role must be either STUDENT or COMPANY." }),
  }),
  // Student fields
  firstName: z.string().min(1, "First name is required.").optional(),
  lastName: z.string().min(1, "Last name is required.").optional(),
  // Company fields
  companyName: z.string().min(2, "Company name must be at least 2 characters.").optional(),
  sector: z.string().optional(),
  city: z.string().min(2, "City is required."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    // Validate password strength
    const passwordCheck = validatePasswordStrength(data.password);
    if (!passwordCheck.isValid) {
      return apiError(passwordCheck.message || "Password is not strong enough.", "INVALID_PASSWORD", 400);
    }

    // Role-specific field validation
    if (data.role === "STUDENT") {
      if (!data.firstName || !data.lastName) {
        return apiError("First name and last name are required for student accounts.", "VALIDATION_FAILED", 400);
      }
    } else if (data.role === "COMPANY") {
      if (!data.companyName) {
        return apiError("Company name is required for company accounts.", "VALIDATION_FAILED", 400);
      }
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      return apiError("An account with this email address already exists.", "CONFLICT", 409);
    }

    const passwordHash = await hashPassword(data.password);
    const normalizedEmail = data.email.toLowerCase().trim();

    // Execute atomic creation in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: data.role,
          isActive: true,
        },
      });

      let studentProfileId: string | undefined;
      let companyId: string | undefined;

      if (data.role === "STUDENT") {
        const profile = await tx.studentProfile.create({
          data: {
            userId: user.id,
            firstName: data.firstName!,
            lastName: data.lastName!,
            city: data.city,
            profileCompleteness: 20, // Initial baseline for name + city
          },
        });
        studentProfileId = profile.id;
      } else if (data.role === "COMPANY") {
        const company = await tx.company.create({
          data: {
            legalName: data.companyName!,
            sector: data.sector || "General",
            city: data.city,
            status: "PENDING_VERIFICATION",
          },
        });
        await tx.companyMembership.create({
          data: {
            companyId: company.id,
            userId: user.id,
            role: "OWNER",
          },
        });
        companyId = company.id;
      }

      // Record audit event
      await tx.auditEvent.create({
        data: {
          actorUserId: user.id,
          action: "USER_REGISTERED",
          targetType: "User",
          targetId: user.id,
          metadata: JSON.stringify({ role: data.role, email: normalizedEmail }),
        },
      });

      return { user, studentProfileId, companyId };
    });

    // Sign session token
    const token = await signSessionToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      studentProfileId: result.studentProfileId,
      companyId: result.companyId,
      companyRole: result.user.role === "COMPANY" ? "OWNER" : undefined,
    });

    const redirectUrl = result.user.role === "STUDENT" ? "/student/dashboard" : "/company/dashboard";

    const response = apiSuccess(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          studentProfileId: result.studentProfileId,
          companyId: result.companyId,
        },
        redirectUrl,
      },
      201
    );

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
