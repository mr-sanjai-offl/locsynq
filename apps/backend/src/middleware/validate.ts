import path from 'path';

/**
 * Sanitize a filename to prevent path traversal attacks.
 * Removes directory components, null bytes, and dangerous characters.
 */
export function sanitizeFilename(filename: string): string {
  // Get just the basename (removes any path components)
  let safe = path.basename(filename);

  // Remove null bytes
  safe = safe.replace(/\0/g, '');

  // Remove leading dots (hidden files / traversal)
  safe = safe.replace(/^\.+/, '');

  // Replace problematic characters
  safe = safe.replace(/[<>:"/\\|?*]/g, '_');

  // Fallback if empty
  if (!safe || safe.length === 0) {
    safe = `file_${Date.now()}`;
  }

  return safe;
}

/**
 * Validate that a string is a valid bucket name.
 */
export function validateBucketName(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return 'Bucket name is required';
  }
  if (name.length < 1 || name.length > 100) {
    return 'Bucket name must be 1-100 characters';
  }
  return null;
}

/**
 * Validate PIN format.
 */
export function validatePin(pin: string): string | null {
  if (!pin || typeof pin !== 'string') {
    return 'PIN is required';
  }
  if (pin.length < 4 || pin.length > 20) {
    return 'PIN must be 4-20 characters';
  }
  return null;
}

/**
 * Validate URL format.
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
