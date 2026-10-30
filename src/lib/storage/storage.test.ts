import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import { LocalStorageProvider, signFileAccessToken, verifyFileAccessToken } from "./index";

describe("Private Storage & Security", () => {
  const testDir = "./storage/test_private";
  let storage: LocalStorageProvider;

  beforeEach(() => {
    storage = new LocalStorageProvider(testDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(path.resolve(process.cwd(), testDir), { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it("should save and retrieve a private buffer correctly", async () => {
    const key = "test/subfolder/sample.pdf";
    const data = Buffer.from("%PDF-1.7 Test PDF Data");

    await storage.save(key, data, "application/pdf");
    const exists = await storage.exists(key);
    expect(exists).toBe(true);

    const retrieved = await storage.get(key);
    expect(retrieved.toString()).toEqual(data.toString());
  });

  it("should prevent directory traversal attacks (LFI)", async () => {
    const maliciousKey = "../../../../outside.txt";
    const data = Buffer.from("Attacker payload");

    const savedKey = await storage.save(maliciousKey, data, "text/plain");
    // Verify it stays inside testDir
    const exists = await storage.exists(savedKey);
    expect(exists).toBe(true);

    // Ensure it did not write outside the base directory
    const outsidePath = path.resolve(process.cwd(), "./outside.txt");
    let outsideExists = false;
    try {
      await fs.access(outsidePath);
      outsideExists = true;
    } catch {
      outsideExists = false;
    }
    expect(outsideExists).toBe(false);
  });

  it("should sign and verify ephemeral signed file access tokens", async () => {
    const token = await signFileAccessToken(
      {
        cvDocumentId: "cv_doc_123",
        userId: "usr_student_789",
      },
      60
    );

    expect(typeof token).toBe("string");
    const verified = await verifyFileAccessToken(token);

    expect(verified).not.toBeNull();
    expect(verified?.cvDocumentId).toBe("cv_doc_123");
    expect(verified?.userId).toBe("usr_student_789");
  });
});
