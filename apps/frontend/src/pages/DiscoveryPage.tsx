import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Database, 
  Plus, 
  Shield, 
  Clock, 
  Globe, 
  QrCode, 
  RefreshCw, 
  Users, 
  Monitor,
  ArrowRight
} from 'lucide-react';
import { healthApi } from '../services/api';
import { wsService } from '../services/websocket';
import { useBucketStore } from '../stores/bucketStore';
import { usePeerStore } from '../stores/peerStore';
import { QRCodeDisplay } from '../components/QRCodeDisplay';

export function DiscoveryPage() {
  const navigate = useNavigate();
  const self = usePeerStore(s => s.self);
  const peers = usePeerStore(s => s.peers);
  const fetchPeers = usePeerStore(s => s.fetchPeers);
  
  const buckets = useBucketStore(s => s.buckets);
  const fetchBuckets = useBucketStore(s => s.fetchBuckets);
  
  const [showQR, setShowQR] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    loadData();

    const unsubBucket = wsService.on('BUCKET_CREATED', fetchBuckets);
    const unsubDeleted = wsService.on('BUCKET_DELETED', fetchBuckets);
    const unsubHealth = setInterval(checkHealth, 5000);

    return () => {
      unsubBucket();
      unsubDeleted();
      clearInterval(unsubHealth);
    };
  }, []);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchPeers(), fetchBuckets()]);
      setStatus('online');
    } catch (err) {
      console.error('Failed to load discovery data:', err);
      setStatus('offline');
    } finally {
      setIsRefreshing(false);
    }
  };

  const checkHealth = async () => {
    try {
      await healthApi.check();
      setStatus('online');
    } catch {
      setStatus('offline');
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'pin-protected': return <Shield size={14} />;
      case 'temporary': return <Clock size={14} />;
      default: return <Globe size={14} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Radar Section */}
      <div className="relative flex flex-col items-center justify-center mb-16">
        <div className="relative w-72 h-72">
          {/* Radar Waves */}
          <div className="absolute inset-0 border-2 border-primary-500/20 rounded-full animate-ping-slow" />
          <div className="absolute inset-4 border border-primary-500/10 rounded-full animate-pulse-subtle" />
          <div className="absolute inset-12 border border-primary-500/5 rounded-full" />
          
          {/* Radar Sweep */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-transparent rounded-full animate-radar opacity-40" />
          
          {/* Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Monitor size={22} className="text-white" />
            </div>
          </div>
        </div>

        <div className="text-center mt-8 space-y-2">
          <h2 className="text-4xl font-extrabold text-white tracking-tight">
            Local <span className="text-primary-400">Bucket</span> Sharing
          </h2>
          <p className="text-surface-400 max-w-sm mx-auto">
            Share files, text, and links instantly across your local network. No internet needed.
          </p>
        </div>
      </div>

      {/* Host Info Card */}
      <div className="card mb-12 border-primary-500/20 glow-primary p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <Monitor size={18} className="text-primary-400" />
            </div>
            {self ? (
              <div>
                <p className="text-sm font-semibold text-white">{self.name}</p>
                <p className="text-xs text-surface-500">{self.ip}:{self.port}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-surface-400 italic">Finding local host...</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowQR(!showQR)}
              className="btn-ghost"
              disabled={!self}
              title="Show QR Code"
            >
              <QrCode size={18} />
            </button>
            <button onClick={loadData} className="btn-ghost" title="Refresh">
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <Link to="/create" className="btn-primary py-2 text-sm">
              <Plus size={16} />
              <span>Create Bucket</span>
            </Link>
          </div>
        </div>

        {showQR && self && (
          <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center animate-fade-in">
            <QRCodeDisplay url={`http://${self.ip}:${self.port}`} />
          </div>
        )}
      </div>

      {/* Buckets Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            Active Buckets
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-surface-400 font-normal">
              {buckets.length}
            </span>
          </h3>
          <Link to="/create" className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1">
            <Plus size={14} /> New Bucket
          </Link>
        </div>

        {buckets.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Monitor size={28} className="text-surface-500" />
            </div>
            <p className="text-surface-400 mb-2">No buckets yet</p>
            <p className="text-surface-600 text-sm mb-6">Create a bucket to start sharing files on your network</p>
            <Link to="/create" className="btn-secondary">
              <Plus size={18} />
              <span>Create your first bucket</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buckets.map((bucket) => (
              <Link 
                key={bucket.id} 
                to={`/bucket/${bucket.id}`}
                className="card group hover:border-primary-500/40 transition-all duration-300 p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                    <Database size={20} className="text-surface-400 group-hover:text-primary-400" />
                  </div>
                  <div className="flex gap-2">
                    <div className={
                      bucket.mode === 'public' ? 'badge-public' : 
                      bucket.mode === 'pin-protected' ? 'badge-protected' : 'badge-temporary'
                    }>
                      {getModeIcon(bucket.mode)}
                      {bucket.mode.replace('-', ' ')}
                    </div>
                  </div>
                </div>
                
                <h4 className="text-lg font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">
                  {bucket.name}
                </h4>
                
                <div className="flex items-center justify-between mt-6 text-surface-500 text-xs">
                  <div className="flex items-center gap-2">
                    <Users size={12} />
                    <span>Active LAN</span>
                  </div>
                  <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
