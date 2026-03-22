import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getBucket, validatePin as checkPin } from '../storage';
import { config } from '../config';

const router = Router();

// POST /api/bucket/:id/auth
router.post('/:id/auth', (req: Request, res: Response) => {
  const { id } = req.params;
  const { pin } = req.body;

  const bucket = getBucket(id);
  if (!bucket) {
    res.status(404).json({ success: false, error: 'Bucket not found' });
    return;
  }

  if (!bucket.isProtected) {
    // No auth needed for public buckets
    res.json({
      success: true,
      data: { token: null, bucketId: id, message: 'Bucket is public' },
    });
    return;
  }

  if (!pin) {
    res.status(400).json({ success: false, error: 'PIN is required' });
    return;
  }

  if (!checkPin(id, pin)) {
    res.status(403).json({ success: false, error: 'Invalid PIN' });
    return;
  }

  // Generate session token
  const token = jwt.sign(
    { bucketId: id, isOwner: false },
    config.jwtSecret,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    data: { token, bucketId: id },
  });
});

export default router;
