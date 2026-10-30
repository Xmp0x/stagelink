import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  correlationId: string;
  timestamp: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  correlationId: string;
  timestamp: string;
}

export function generateCorrelationId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  const correlationId = generateCorrelationId();
  return NextResponse.json(
    {
      success: true,
      data,
      correlationId,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function apiError(
  message: string,
  code = "BAD_REQUEST",
  status = 400,
  details?: ApiErrorDetail[]
): NextResponse<ApiErrorResponse> {
  const correlationId = generateCorrelationId();
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      correlationId,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export class ApiError extends Error {
  constructor(public statusCode: number, message: string, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(err: unknown): NextResponse<ApiErrorResponse> {
  if (err instanceof ApiError) {
    const code = err.code || (err.statusCode === 404 ? "NOT_FOUND" : err.statusCode === 403 ? "FORBIDDEN" : err.statusCode === 401 ? "UNAUTHORIZED" : err.statusCode === 409 ? "CONFLICT" : "BAD_REQUEST");
    return apiError(err.message, code, err.statusCode);
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return apiError("Validation failed for input data.", "VALIDATION_FAILED", 400, details);
  }

  if (err instanceof Error) {
    if (err.message.includes("Unauthorized") || err.message.includes("UNAUTHORIZED")) {
      return apiError(err.message, "UNAUTHORIZED", 401);
    }
    if (err.message.includes("Forbidden") || err.message.includes("FORBIDDEN")) {
      return apiError(err.message, "FORBIDDEN", 403);
    }
    if (err.message.includes("NotFound") || err.message.includes("NOT_FOUND")) {
      return apiError(err.message, "NOT_FOUND", 404);
    }
    if (err.message.includes("Conflict") || err.message.includes("CONFLICT")) {
      return apiError(err.message, "CONFLICT", 409);
    }
    return apiError(err.message, "INTERNAL_ERROR", 500);
  }

  return apiError("An unexpected error occurred.", "INTERNAL_ERROR", 500);
}
