import { describe, it, expect } from "vitest";
import { validatePdfBuffer, MAX_FILE_SIZE_BYTES } from "./parser";

describe("PDF Validation & Security Checks", () => {
  it("should accept a buffer with valid %PDF magic bytes", () => {
    // Valid %PDF header: 0x25 0x50 0x44 0x46
    const validHeader = Buffer.from("%PDF-1.7\nSample PDF content");
    const result = validatePdfBuffer(validHeader);

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should reject files with invalid magic bytes (e.g. disguised executable or text)", () => {
    const fakePdf = Buffer.from("MZ\x90\x00\x03\x00\x00\x00Fake executable");
    const result = validatePdfBuffer(fakePdf);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Invalid file signature");
  });

  it("should reject an empty buffer", () => {
    const empty = Buffer.alloc(0);
    const result = validatePdfBuffer(empty);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("empty");
  });

  it("should reject files exceeding the 5MB limit", () => {
    // Allocate 5MB + 1 byte
    const oversized = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1);
    // Add valid magic bytes so size check triggers
    oversized[0] = 0x25;
    oversized[1] = 0x50;
    oversized[2] = 0x44;
    oversized[3] = 0x46;

    const result = validatePdfBuffer(oversized);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("exceeds the 5MB maximum limit");
  });
});
