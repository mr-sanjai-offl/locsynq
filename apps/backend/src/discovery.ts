import Bonjour from 'bonjour-service';
import { MDNS_SERVICE_TYPE } from '@locsynq/shared';
import { config } from './config';
import { Device } from '@locsynq/shared';

let bonjour: InstanceType<typeof Bonjour>;
let browser: any;
const discoveredPeers = new Map<string, Device>();

export function startDiscovery(): void {
  try {
    bonjour = new Bonjour();

    // Publish this host as a service
    bonjour.publish({
      name: config.deviceName,
      type: MDNS_SERVICE_TYPE,
      port: config.port,
      txt: {
        id: config.deviceId,
        ip: config.localIP,
      },
    });

    console.log(`[mDNS] Published service: ${config.deviceName} on port ${config.port}`);

    // Browse for other Locsynq services
    browser = bonjour.find({ type: MDNS_SERVICE_TYPE }, (service: any) => {
      const deviceId = service.txt?.id || service.name;
      if (deviceId === config.deviceId) return; // skip self

      const device: Device = {
        id: deviceId,
        name: service.name,
        ip: service.txt?.ip || service.referer?.address || '',
        port: service.port,
      };

      discoveredPeers.set(deviceId, device);
      console.log(`[mDNS] Discovered peer: ${device.name} at ${device.ip}:${device.port}`);
    });

    console.log('[mDNS] Discovery started');
  } catch (err) {
    console.error('[mDNS] Failed to start discovery:', err);
    console.log('[mDNS] Falling back to manual IP entry mode');
  }
}

export function getPeers(): Device[] {
  return Array.from(discoveredPeers.values());
}

export function stopDiscovery(): void {
  try {
    if (browser) browser.stop();
    if (bonjour) bonjour.destroy();
    console.log('[mDNS] Discovery stopped');
  } catch (err) {
    console.error('[mDNS] Error stopping discovery:', err);
  }
}
