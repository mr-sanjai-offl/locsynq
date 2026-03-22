import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  Bucket,
  BucketFile,
  BucketContent,
  BucketMode,
  ContentType,
} from '@locsynq/shared';
import { config } from './config';

// ─── In-Memory Stores ───
const buckets = new Map<string, Bucket & { pin?: string }>();
const bucketFiles = new Map<string, BucketFile[]>();
const bucketContents = new Map<string, BucketContent[]>();

// ─── Initialize Storage Directory ───
export function initStorage(): void {
  if (!fs.existsSync(config.storagePath)) {
    fs.mkdirSync(config.storagePath, { recursive: true });
  }
}

// ─── Bucket Operations ───
export function createBucket(
  name: string,
  mode: BucketMode,
  pin?: string,
  expiresInMinutes?: number
): Bucket & { pin?: string } {
  const id = uuidv4();
  const now = new Date().toISOString();

  const bucket: Bucket & { pin?: string } = {
    id,
    name,
    hostId: config.deviceId,
    mode,
    isProtected: mode === 'pin-protected',
    createdAt: now,
    ...(mode === 'temporary' && expiresInMinutes
      ? { expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString() }
      : {}),
    ...(pin ? { pin } : {}),
  };

  // Create bucket storage directory
  const bucketDir = path.join(config.storagePath, id);
  if (!fs.existsSync(bucketDir)) {
    fs.mkdirSync(bucketDir, { recursive: true });
  }

  buckets.set(id, bucket);
  bucketFiles.set(id, []);
  bucketContents.set(id, []);

  // Set auto-delete timer for temporary buckets
  if (mode === 'temporary' && expiresInMinutes) {
    setTimeout(() => {
      deleteBucket(id);
    }, expiresInMinutes * 60 * 1000);
  }

  return bucket;
}

export function getBucket(id: string): (Bucket & { pin?: string }) | undefined {
  return buckets.get(id);
}

export function listBuckets(): Bucket[] {
  const now = Date.now();
  const result: Bucket[] = [];

  for (const [id, bucket] of buckets) {
    // Skip expired buckets
    if (bucket.expiresAt && new Date(bucket.expiresAt).getTime() < now) {
      deleteBucket(id);
      continue;
    }
    // Return without pin
    const { pin, ...publicBucket } = bucket;
    result.push(publicBucket);
  }

  return result;
}

export function deleteBucket(id: string): boolean {
  const bucket = buckets.get(id);
  if (!bucket) return false;

  // Delete storage directory
  const bucketDir = path.join(config.storagePath, id);
  if (fs.existsSync(bucketDir)) {
    fs.rmSync(bucketDir, { recursive: true, force: true });
  }

  buckets.delete(id);
  bucketFiles.delete(id);
  bucketContents.delete(id);
  return true;
}

export function validatePin(bucketId: string, pin: string): boolean {
  const bucket = buckets.get(bucketId);
  if (!bucket) return false;
  if (!bucket.isProtected) return true;
  return bucket.pin === pin;
}

// ─── File Operations ───
export function addFile(bucketId: string, file: BucketFile): void {
  const files = bucketFiles.get(bucketId);
  if (files) {
    // Remove existing file with same name
    const idx = files.findIndex((f) => f.name === file.name);
    if (idx !== -1) files.splice(idx, 1);
    files.push(file);
  }
}

export function getFiles(bucketId: string): BucketFile[] {
  return bucketFiles.get(bucketId) || [];
}

export function getFilePath(bucketId: string, fileName: string): string | null {
  const safeName = path.basename(fileName); // prevent path traversal
  const filePath = path.join(config.storagePath, bucketId, safeName);

  // Additional path traversal check
  if (!filePath.startsWith(path.join(config.storagePath, bucketId))) {
    return null;
  }

  if (!fs.existsSync(filePath)) return null;
  return filePath;
}

export function deleteFile(bucketId: string, fileName: string): boolean {
  const safeName = path.basename(fileName);
  const filePath = path.join(config.storagePath, bucketId, safeName);

  if (!filePath.startsWith(path.join(config.storagePath, bucketId))) {
    return false;
  }

  const files = bucketFiles.get(bucketId);
  if (files) {
    const idx = files.findIndex((f) => f.name === safeName);
    if (idx !== -1) {
      files.splice(idx, 1);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return true;
    }
  }
  return false;
}

// ─── Content Operations ───
export function addContent(
  bucketId: string,
  type: ContentType,
  value: string,
  label?: string
): BucketContent {
  const content: BucketContent = {
    id: uuidv4(),
    type,
    value,
    label,
    createdAt: new Date().toISOString(),
  };

  const contents = bucketContents.get(bucketId);
  if (contents) {
    contents.push(content);
  }

  return content;
}

export function getContents(bucketId: string): BucketContent[] {
  return bucketContents.get(bucketId) || [];
}

export function deleteContent(bucketId: string, contentId: string): boolean {
  const contents = bucketContents.get(bucketId);
  if (contents) {
    const idx = contents.findIndex((c) => c.id === contentId);
    if (idx !== -1) {
      contents.splice(idx, 1);
      return true;
    }
  }
  return false;
}

// ─── Utility ───
export function getBucketStoragePath(bucketId: string): string {
  return path.join(config.storagePath, bucketId);
}
