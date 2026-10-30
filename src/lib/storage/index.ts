import fs from "fs/promises";
import path from "path";
import { SignJWT, jwtVerify } from "jose";

export interface StorageProvider {
  save(key: string, data: Buffer, mimeType: string): Promise<string>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = path.resolve(
      process.cwd(),
      baseDir || process.env.STORAGE_LOCAL_PATH || "./storage/private"
    );
  }

  private sanitizeKey(key: string): string {
    // Prevent directory traversal attacks
    const sanitized = key.replace(/(\.\.[\/\\])+/g, "").replace(/^[\/\\]+/, "");
    return path.join(this.baseDir, sanitized);
  }

  async save(key: string, data: Buffer, mimeType: string): Promise<string> {
    const fullPath = this.sanitizeKey(key);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, data);
    return key;
  }

  async get(key: string): Promise<Buffer> {
    const fullPath = this.sanitizeKey(key);
    try {
      return await fs.readFile(fullPath);
    } catch {
      throw new Error(`File not found at storage key: ${key}`);
    }
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.sanitizeKey(key);
    try {
      await fs.unlink(fullPath);
    } catch {
      // File may already be deleted, ignore
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = this.sanitizeKey(key);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}

// Storage Singleton Factory
let storageInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!storageInstance) {
    storageInstance = new LocalStorageProvider();
  }
  return storageInstance;
}

// -----------------------------------------------------------------------------
// Signed Private File Access Tokens (Ephemeral 5-minute access)
// -----------------------------------------------------------------------------

function getStorageSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || "default-insecure-storage-token-secret-32-chars";
  return new TextEncoder().encode(secret);
}

export interface FileTokenPayload {
  cvDocumentId: string;
  userId: string;
  companyId?: string;
}

export async function signFileAccessToken(
  payload: FileTokenPayload,
  expiresInSeconds = 300 // 5 minutes
): Promise<string> {
  const secret = getStorageSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(secret);
}

export async function verifyFileAccessToken(token: string): Promise<FileTokenPayload | null> {
  try {
    const secret = getStorageSecret();
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

    if (!payload.cvDocumentId || !payload.userId) {
      return null;
    }

    return {
      cvDocumentId: payload.cvDocumentId as string,
      userId: payload.userId as string,
      companyId: payload.companyId as string | undefined,
    };
  } catch {
    return null;
  }
}
