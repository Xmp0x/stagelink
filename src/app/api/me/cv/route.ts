import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { getStorageProvider } from "@/lib/storage";
import { validatePdfBuffer, parseCvPdf } from "@/lib/cv/parser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["STUDENT"], req);

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!profile) {
      return apiError("Student profile not found.", "NOT_FOUND", 404);
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return apiError("No file uploaded. Please upload a PDF CV.", "BAD_REQUEST", 400);
    }

    const filename = file.name || "resume.pdf";
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Strict signature and size check
    const validation = validatePdfBuffer(buffer);
    if (!validation.isValid) {
      return apiError(validation.error || "Invalid file.", "INVALID_FILE", 400);
    }

    // Generate secure private storage key outside webroot
    const storageKey = `cvs/${profile.id}/${Date.now()}-${crypto.randomUUID()}.pdf`;
    const storage = getStorageProvider();
    await storage.save(storageKey, buffer, "application/pdf");

    // Deactivate previous active CV versions
    await prisma.cVDocument.updateMany({
      where: { studentId: profile.id, activeVersion: true },
      data: { activeVersion: false },
    });

    // Create CVDocument record
    const cvDocument = await prisma.cVDocument.create({
      data: {
        studentId: profile.id,
        filename,
        storageKey,
        mimeType: "application/pdf",
        fileSizeBytes: buffer.length,
        processingStatus: "PENDING",
        activeVersion: true,
      },
    });

    // Run extraction pipeline
    let extracted;
    try {
      extracted = await parseCvPdf(buffer);
    } catch {
      await prisma.cVDocument.update({
        where: { id: cvDocument.id },
        data: { processingStatus: "FAILED" },
      });
      return apiError("Failed to extract text from PDF document.", "EXTRACTION_FAILED", 422);
    }

    // Persist extraction suggestions
    const extraction = await prisma.cVExtraction.create({
      data: {
        cvDocumentId: cvDocument.id,
        studentId: profile.id,
        rawText: extracted.rawText,
        extractedSkills: JSON.stringify(extracted.skills.map((s) => s.name)),
        extractedEducation: JSON.stringify(extracted.education),
        confidenceScore: extracted.overallConfidence,
        status: "PENDING_REVIEW",
      },
    });

    // Update processing status
    await prisma.cVDocument.update({
      where: { id: cvDocument.id },
      data: { processingStatus: "PROCESSED" },
    });

    // Audit log
    await prisma.auditEvent.create({
      data: {
        actorUserId: session.userId,
        action: "CV_UPLOADED_AND_PARSED",
        targetType: "CVDocument",
        targetId: cvDocument.id,
        metadata: JSON.stringify({
          filename,
          sizeBytes: buffer.length,
          confidence: extracted.overallConfidence,
          extractedSkillsCount: extracted.skills.length,
        }),
      },
    });

    return apiSuccess(
      {
        cvDocument: {
          id: cvDocument.id,
          filename: cvDocument.filename,
          sizeBytes: cvDocument.fileSizeBytes,
          createdAt: cvDocument.createdAt,
        },
        extraction: {
          id: extraction.id,
          skills: extracted.skills,
          education: extracted.education,
          languages: extracted.languages,
          confidence: extracted.overallConfidence,
          warning: extracted.warning,
        },
      },
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}
