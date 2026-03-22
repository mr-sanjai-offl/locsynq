import { Router, Request, Response } from 'express';
import { getPeers } from '../discovery';
import { config } from '../config';

const router = Router();

// GET /api/peers
router.get('/', (_req: Request, res: Response) => {
  const peers = getPeers();
  res.json({
    success: true,
    data: {
      self: {
        id: config.deviceId,
        name: config.deviceName,
        ip: config.localIP,
        port: config.port,
      },
      peers,
    },
  });
});

export default router;
