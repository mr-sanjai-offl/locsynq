import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { BucketMode, WSEventType } from '@locsynq/shared';
import { createBucket, listBuckets, getBucket, deleteBucket } from '../storage';
import { config } from '../config';
import { broadcast } from '../websocket';
import { validateBucketName, validatePin } from '../middleware/validate';
import { requireOwner, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// POST /api/bucket/create
router.post('/create', (req: Request, res: Response) => {
  const { name, mode, pin, expiresInMinutes } = req.body;

  // Validate name
  const nameError = validateBucketName(name);
  if (nameError) {
    res.status(400).json({ success: false, error: nameError });
    return;
  }

  // Validate mode
  const validModes: BucketMode[] = ['public', 'pin-protected', 'temporary'];
  if (!mode || !validModes.includes(mode)) {
    res.status(400).json({ success: false, error: 'Invalid bucket mode' });
    return;
  }

  // Validate PIN if pin-protected
  if (mode === 'pin-protected') {
    if (!pin) {
      res.status(400).json({ success: false, error: 'PIN required for protected buckets' });
      return;
    }
    const pinError = validatePin(pin);
    if (pinError) {
      res.status(400).json({ success: false, error: pinError });
      return;
    }
  }

  const bucket = createBucket(name, mode, pin, expiresInMinutes);

  // Generate owner token
  const ownerToken = jwt.sign(
    { bucketId: bucket.id, isOwner: true },
    config.jwtSecret,
    { expiresIn: '24h' }
  );

  // Broadcast creation event
  const { pin: _pin, ...publicBucket } = bucket;
  broadcast(WSEventType.BUCKET_CREATED, bucket.id, publicBucket);

  res.status(201).json({
    success: true,
    data: {
      bucket: publicBucket,
      ownerToken,
    },
  });
});

// GET /api/bucket/list
router.get('/list', (_req: Request, res: Response) => {
  const all = listBuckets();
  res.json({ success: true, data: all });
});

// GET /api/bucket/:id
router.get('/:id', (req: Request, res: Response) => {
  const bucket = getBucket(req.params.id);
  if (!bucket) {
    res.status(404).json({ success: false, error: 'Bucket not found' });
    return;
  }
  const { pin, ...publicBucket } = bucket;
  res.json({ success: true, data: publicBucket });
});

// DELETE /api/bucket/:id
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const bucketId = req.params.id;
  const bucket = getBucket(bucketId);

  if (!bucket) {
    res.status(404).json({ success: false, error: 'Bucket not found' });
    return;
  }

  // Check owner token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as {
        bucketId: string;
        isOwner: boolean;
      };
      if (decoded.bucketId !== bucketId || !decoded.isOwner) {
        res.status(403).json({ success: false, error: 'Only the bucket owner can delete' });
        return;
      }
    } catch {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }
  } else {
    res.status(401).json({ success: false, error: 'Owner authentication required' });
    return;
  }

  deleteBucket(bucketId);
  broadcast(WSEventType.BUCKET_DELETED, bucketId);

  res.json({ success: true, data: { deleted: bucketId } });
});

export default router;
