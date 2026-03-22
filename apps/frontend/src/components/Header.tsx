import { Link, useLocation } from 'react-router-dom';
import { Wifi, WifiOff, Bucket, Plus } from 'lucide-react';
import { usePeerStore } from '../stores/peerStore';

export function Header() {
  const location = useLocation();
  const { isConnected, self } = usePeerStore();

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center shadow-lg shadow-primary-600/25 group-hover:shadow-primary-500/40 transition-shadow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7h-5a8 8 0 0 0-5 2 8 8 0 0 0-5-2H2Z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-gradient">Loc</span>
            <span className="text-white">synq</span>
          </span>
        </Link>

        {/* Nav */}
        <div className="flex items-center gap-3">
          {location.pathname !== '/create' && (
            <Link to="/create" className="btn-primary text-sm">
              <Plus size={16} />
              <span className="hidden sm:inline">Create Bucket</span>
            </Link>
          )}

          {/* Connection Status */}
          <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 text-xs">
            {isConnected ? (
              <>
                <Wifi size={14} className="text-emerald-400" />
                <span className="text-emerald-400 hidden sm:inline">Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={14} className="text-surface-500" />
                <span className="text-surface-500 hidden sm:inline">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
