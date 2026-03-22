import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { config } from './config';
import { initStorage } from './storage';
import { initWebSocket } from './websocket';
import { startDiscovery, stopDiscovery } from './discovery';

// Route imports
import bucketRoutes from './routes/bucket';
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';
import contentRoutes from './routes/content';
import peerRoutes from './routes/peers';

const app = express();
const server = http.createServer(app);

// ─── Middleware ───
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───
app.use('/api/bucket', bucketRoutes);
app.use('/api/bucket', authRoutes);
app.use('/api/bucket', fileRoutes);
app.use('/api/bucket', contentRoutes);
app.use('/api/peers', peerRoutes);

// ─── Health Check ───
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'running',
      device: {
        id: config.deviceId,
        name: config.deviceName,
        ip: config.localIP,
        port: config.port,
      },
    },
  });
});

// ─── Serve Frontend in Production ───
if (config.isProduction) {
  const frontendPath = config.frontendPath;
  app.use(express.static(frontendPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ─── Initialize & Start ───
initStorage();
initWebSocket(server);

server.listen(config.port, config.host, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║                  🪣 LOCSYNQ                      ║');
  console.log('║          Local Bucket Sharing System              ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Server:    ${config.publicUrl}`);
  console.log(`║  Device:    ${config.deviceName}`);
  console.log(`║  Device ID: ${config.deviceId.substring(0, 20)}...`);
  console.log(`║  Storage:   ${config.storagePath}`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  API:       /api/bucket/*                         ║');
  console.log('║  WebSocket: /ws                                   ║');
  console.log('║  Peers:     /api/peers                            ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // Start mDNS discovery only if not in cloud environment
  if (!process.env.RENDER) {
    startDiscovery();
  } else {
    console.log('[Info] Running in cloud mode, mDNS discovery disabled.');
  }
});

// ─── Graceful Shutdown ───
const shutdown = () => {
  console.log('\n[Server] Shutting down gracefully...');
  stopDiscovery();
  server.close(() => {
    console.log('[Server] Closed');
    process.exit(0);
  });
  // Force close after 5s
  setTimeout(() => process.exit(1), 5000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
