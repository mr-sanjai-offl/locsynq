import { Router, Response } from 'express';
import { WSEventType } from '@locsynq/shared';
import { addContent, getContents, deleteContent, getBucket } from '../storage';
import { requireBucketAuth, AuthenticatedRequest } from '../middleware/auth';
import { validateUrl } from '../middleware/validate';
import { broadcast } from '../websocket';

const router = Router();

// POST /api/bucket/:id/text
router.post('/:id/text', requireBucketAuth, (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const { value, label } = req.body;

  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    res.status(400).json({ success: false, error: 'Text value is required' });
    return;
  }

  if (value.length > 50000) {
    res.status(400).json({ success: false, error: 'Text too long (max 50000 chars)' });
    return;
  }

  const content = addContent(id, 'text', value.trim(), label as string);
  broadcast(WSEventType.CONTENT_ADDED, id, content);

  res.status(201).json({ success: true, data: content });
});

// POST /api/bucket/:id/link
router.post('/:id/link', requireBucketAuth, (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const { url, label } = req.body;

  if (!url || typeof url !== 'string') {
    res.status(400).json({ success: false, error: 'URL is required' });
    return;
  }

  if (!validateUrl(url)) {
    res.status(400).json({ success: false, error: 'Invalid URL format' });
    return;
  }

  const content = addContent(id, 'link', url as string, label as string);
  broadcast(WSEventType.CONTENT_ADDED, id, content);

  res.status(201).json({ success: true, data: content });
});

// GET /api/bucket/:id/content
router.get('/:id/content', requireBucketAuth, (req: AuthenticatedRequest, res: Response) => {
  const contents = getContents(req.params.id as string);
  res.json({ success: true, data: contents });
});

// DELETE /api/bucket/:id/content/:contentId
router.delete('/:id/content/:contentId', requireBucketAuth, (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const contentId = req.params.contentId as string;
  const deleted = deleteContent(id, contentId);

  if (!deleted) {
    res.status(404).json({ success: false, error: 'Content not found' });
    return;
  }

  broadcast(WSEventType.CONTENT_REMOVED, id, { contentId });
  res.json({ success: true, data: { deleted: contentId } });
});

export default router;
