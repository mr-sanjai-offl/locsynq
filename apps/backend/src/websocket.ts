import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { WSEventType, WSMessage } from '@locsynq/shared';

let wss: WebSocketServer;

export function initWebSocket(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS] Client connected');

    // Heartbeat
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('pong', () => {
      // Client is alive
    });

    ws.on('close', () => {
      console.log('[WS] Client disconnected');
      clearInterval(pingInterval);
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err.message);
      clearInterval(pingInterval);
    });
  });

  console.log('[WS] WebSocket server initialized');
  return wss;
}

export function broadcast(event: WSEventType, bucketId?: string, data?: any): void {
  if (!wss) return;

  const message: WSMessage = {
    event,
    bucketId,
    data,
    timestamp: new Date().toISOString(),
  };

  const payload = JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

export function getWSS(): WebSocketServer | undefined {
  return wss;
}
