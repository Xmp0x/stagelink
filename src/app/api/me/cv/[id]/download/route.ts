import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { apiError } from "@/lib/utils/api";
import { getStorageProvider } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return apiError("Authentication required.", "UNAUTHORIZED", 401);
    }

    const cvDocumentId = params.id;

    const cvDocument = await prisma.cVDocument.findUnique({
      where: { id: cvDocumentId },
      include: {
        student: { select: { id: true, userId: true } },
      },
    });

    if (!cvDocument) {
      return apiError("CV document not found.", "NOT_FOUND", 404);
    }

    // 1. Student Owner Permission
    const isOwner = cvDocument.student.userId === session.userId;

    // 2. Platform Admin Permission
    const isAdmin = session.role === "ADMIN";

    // 3. Company Member Permission (ONLY if candidate applied to company's listing)
    let isAuthorizedEmployer = false;
    if (session.companyId) {
      const application = await prisma.application.findFirst({
        where: {
          studentId: cvDocument.student.id,
          internship: { companyId: session.companyId },
        },
      });
      if (application) {
        isAuthorizedEmployer = true;
      }
    }

    if (!isOwner && !isAdmin && !isAuthorizedEmployer) {
      return apiError(
        "You do not have permission to access this private CV document.",
        "FORBIDDEN",
        403
      );
    }

    // Retrieve private buffer from storage provider
    const storage = getStorageProvider();
    const buffer = await storage.get(cvDocument.storageKey);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": cvDocument.mimeType || "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(cvDocument.filename)}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("File not found")) {
      return apiError("File not found in storage.", "NOT_FOUND", 404);
    }
    return apiError("Failed to retrieve file.", "INTERNAL_ERROR", 500);
  }
}
