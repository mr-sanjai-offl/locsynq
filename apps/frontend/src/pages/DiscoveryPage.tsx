import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Radio, MonitorSmartphone, Plus, RefreshCw, Server, QrCode, ArrowRight, Lock, Globe, Clock } from 'lucide-react';
import { bucketApi, peersApi, healthApi } from '../services/api';
import { wsService } from '../services/websocket';
import { useBucketStore } from '../stores/bucketStore';
import { usePeerStore } from '../stores/peerStore';
import { QRCodeDisplay } from '../components/QRCodeDisplay';

export function DiscoveryPage() {
  const navigate = useNavigate();
  const { buckets, setBuckets } = useBucketStore();
  const { self, setSelf, setPeers, setConnected } = usePeerStore();
  const [showQR, setShowQR] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    // Connect WebSocket
    wsService.connect();

    const unsubConnect = wsService.on('_connected', () => setConnected(true));
    const unsubDisconnect = wsService.on('_disconnected', () => setConnected(false));

    // Listen for bucket events
    const unsubCreated = wsService.on('BUCKET_CREATED', (msg) => {
      if (msg.data) {
        useBucketStore.getState().addBucket(msg.data);
      }
    });
    const unsubDeleted = wsService.on('BUCKET_DELETED', (msg) => {
      if (msg.bucketId) {
        useBucketStore.getState().removeBucket(msg.bucketId);
      }
    });

    // Initial load
    loadData();

    // Stop scanning animation after 3s
    const scanTimer = setTimeout(() => setIsScanning(false), 3000);

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubCreated();
      unsubDeleted();
      clearTimeout(scanTimer);
    };
  }, []);

  const loadData = async () => {
    try {
      const [bucketsData, peersData] = await Promise.all([
        bucketApi.list(),
        peersApi.list(),
      ]);
      setBuckets(bucketsData);
      setSelf(peersData.self);
      setPeers(peersData.peers);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'pin-protected': return <Lock size={14} />;
      case 'temporary': return <Clock size={14} />;
      default: return <Globe size={14} />;
    }
  };

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'pin-protected': return 'badge-protected';
      case 'temporary': return 'badge-temporary';
      default: return 'badge-public';
    }
  };

  const hostUrl = self ? `http://${self.ip}:${self.port}` : '';

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-4">
        {/* Radar Animation */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border border-primary-500/20" />
          <div className="absolute inset-3 rounded-full border border-primary-500/15" />
          <div className="absolute inset-6 rounded-full border border-primary-500/10" />
          <div className={`absolute inset-0 rounded-full overflow-hidden ${isScanning ? '' : 'opacity-0'} transition-opacity duration-1000`}>
            <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 origin-top-left bg-gradient-to-r from-primary-500/30 to-transparent animate-radar-sweep" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Radio size={22} className="text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold">
          <span className="text-gradient">Local Bucket</span>{' '}
          <span className="text-white">Sharing</span>
        </h1>
        <p className="text-surface-400 max-w-lg mx-auto">
          Share files, text, and links instantly across your local network. No internet needed.
        </p>
      </div>

      {/* Host Info Card */}
      {self && (
        <div className="card glow-primary">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <Server size={18} className="text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{self.name}</p>
                <p className="text-xs text-surface-400">{self.ip}:{self.port}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQR(!showQR)}
                className="btn-ghost"
                title="Show QR Code"
              >
                <QrCode size={18} />
              </button>
              <button onClick={loadData} className="btn-ghost" title="Refresh">
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          {/* QR Code */}
          {showQR && hostUrl && (
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-center animate-slide-down">
              <QRCodeDisplay url={hostUrl} />
            </div>
          )}
        </div>
      )}

      {/* Buckets Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Active Buckets</h2>
          <Link to="/create" className="btn-primary text-sm">
            <Plus size={16} />
            New Bucket
          </Link>
        </div>

        {buckets.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <MonitorSmartphone size={28} className="text-surface-500" />
            </div>
            <p className="text-surface-400 mb-2">No buckets yet</p>
            <p className="text-surface-600 text-sm mb-6">Create a bucket to start sharing files on your network</p>
            <Link to="/create" className="btn-primary">
              <Plus size={16} />
              Create your first bucket
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {buckets.map((bucket) => (
              <button
                key={bucket.id}
                onClick={() => navigate(`/bucket/${bucket.id}`)}
                className="card text-left group hover:bg-white/[0.07] transition-all cursor-pointer"
                id={`bucket-${bucket.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate group-hover:text-primary-300 transition-colors">
                      {bucket.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={getModeBadge(bucket.mode)}>
                        {getModeIcon(bucket.mode)}
                        {bucket.mode === 'pin-protected' ? 'Protected' : bucket.mode === 'temporary' ? 'Temporary' : 'Public'}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-surface-600 group-hover:text-primary-400 transition-colors flex-shrink-0 mt-1" />
                </div>

                {bucket.expiresAt && (
                  <p className="text-xs text-surface-500 mt-3">
                    Expires: {new Date(bucket.expiresAt).toLocaleTimeString()}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
