import path from 'path';
import os from 'os';
import { DEFAULT_PORT, STORAGE_DIR } from '@locsynq/shared';

// Generate a unique device ID based on hostname + MAC
function getDeviceId(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
        return `${os.hostname()}-${iface.mac.replace(/:/g, '')}`;
      }
    }
  }
  return `${os.hostname()}-${Date.now()}`;
}

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

export const config = {
  port: parseInt(process.env.PORT || String(DEFAULT_PORT), 10),
  host: '0.0.0.0',
  storagePath: path.resolve(process.cwd(), process.env.STORAGE_PATH || STORAGE_DIR),
  jwtSecret: process.env.JWT_SECRET || `locsynq-secret-${Date.now()}`,
  deviceId: getDeviceId(),
  deviceName: os.hostname(),
  localIP: getLocalIP(),
  isProduction: process.env.NODE_ENV === 'production',
  frontendPath: path.resolve(__dirname, '../../frontend/dist'),
};
