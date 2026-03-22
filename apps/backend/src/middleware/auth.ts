import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getBucket } from '../storage';

export interface AuthenticatedRequest extends Request {
  bucketAuth?: {
    bucketId: string;
    isOwner: boolean;
  };
}

/**
 * Middleware that checks if a protected bucket requires authentication.
 * If the bucket is public, the request passes through.
 * If protected, validates JWT bearer token.
 */
export function requireBucketAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const bucketId = req.params.id;
  const bucket = getBucket(bucketId);

  if (!bucket) {
    res.status(404).json({ success: false, error: 'Bucket not found' });
    return;
  }

  // Public buckets don't need auth
  if (!bucket.isProtected) {
    req.bucketAuth = { bucketId, isOwner: false };
    next();
    return;
  }

  // Check for Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      bucketId: string;
      isOwner: boolean;
    };

    if (decoded.bucketId !== bucketId) {
      res.status(403).json({ success: false, error: 'Token not valid for this bucket' });
      return;
    }

    req.bucketAuth = {
      bucketId: decoded.bucketId,
      isOwner: decoded.isOwner,
    };
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

/**
 * Middleware that checks for owner-only operations.
 */
export function requireOwner(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // First run bucket auth
  requireBucketAuth(req, res, () => {
    // For owner operations, check the owner token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as {
          bucketId: string;
          isOwner: boolean;
        };
        if (decoded.isOwner) {
          next();
          return;
        }
      } catch {
        // Token invalid
      }
    }
    res.status(403).json({ success: false, error: 'Owner access required' });
  });
}
