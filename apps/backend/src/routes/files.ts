import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { WSEventType, BucketFile } from '@locsynq/shared';
import { addFile, getFiles, getFilePath, deleteFile, getBucketStoragePath, getBucket } from '../storage';
import { requireBucketAuth, AuthenticatedRequest } from '../middleware/auth';
import { sanitizeFilename } from '../middleware/validate';
import { broadcast } from '../websocket';
import { config } from '../config';

const router = Router();

// Configure multer for streaming uploads to disk
const storage = multer.diskStorage({
  destination: (req: any, _file, cb) => {
    const bucketId = req.params.id as string;
    const destPath = getBucketStoragePath(bucketId);
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    cb(null, destPath);
  },
  filename: (_req, file, cb) => {
    const safeName = sanitizeFilename(file.originalname);
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB
  },
});

// POST /api/bucket/:id/upload
router.post('/:id/upload', requireBucketAuth, upload.array('files', 50), (req: AuthenticatedRequest, res: Response) => {
  const bucketId = req.params.id as string;

  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    res.status(400).json({ success: false, error: 'No files uploaded' });
    return;
  }

  const addedFiles: BucketFile[] = [];

  for (const file of req.files) {
    const bucketFile: BucketFile = {
      name: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      createdAt: new Date().toISOString(),
    };

    addFile(bucketId, bucketFile);
    addedFiles.push(bucketFile);

    // Broadcast file added event
    broadcast(WSEventType.FILE_ADDED, bucketId, bucketFile);
  }

  res.status(201).json({
    success: true,
    data: addedFiles,
  });
});

// GET /api/bucket/:id/files
router.get('/:id/files', requireBucketAuth, (req: AuthenticatedRequest, res: Response) => {
  const files = getFiles(req.params.id as string);
  res.json({ success: true, data: files });
});

// GET /api/bucket/:id/files/:name - Stream file download
router.get('/:id/files/:name', requireBucketAuth, (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const name = req.params.name as string;
  const filePath = getFilePath(id, name);

  if (!filePath) {
    res.status(404).json({ success: false, error: 'File not found' });
    return;
  }

  const stat = fs.statSync(filePath);
  const fileName = path.basename(filePath);

  // Support range requests for resume
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Accept-Ranges': 'bytes',
    });

    fs.createReadStream(filePath).pipe(res);
  }
});

// DELETE /api/bucket/:id/files/:name
router.delete('/:id/files/:name', requireBucketAuth, (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const name = req.params.name as string;
  const deleted = deleteFile(id, name);

  if (!deleted) {
    res.status(404).json({ success: false, error: 'File not found' });
    return;
  }

  broadcast(WSEventType.FILE_REMOVED, id, { name });
  res.json({ success: true, data: { deleted: name } });
});

export default router;
