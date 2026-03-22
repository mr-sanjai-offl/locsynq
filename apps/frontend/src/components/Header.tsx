import { Link, useLocation } from 'react-router-dom';
import { Wifi, WifiOff, Database, Plus } from 'lucide-react';
import { usePeerStore } from '../stores/peerStore';

export function Header() {
  const location = useLocation();
  const { isConnected } = usePeerStore();

  return (
    <header className="h-20 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-blue flex items-center justify-center shadow-lg shadow-primary-600/20 group-hover:scale-105 transition-transform duration-200">
            <Database className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-white italic group-hover:text-primary-400 transition-colors">
            Loc<span className="text-primary-500">synq</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            to="/" 
            className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-primary-400' : 'text-surface-400 hover:text-white'}`}
          >
            Discovery
          </Link>
          <Link 
            to="/create" 
            className={`text-sm font-medium transition-colors ${location.pathname === '/create' ? 'text-primary-400' : 'text-surface-400 hover:text-white'}`}
          >
            Create Bucket
          </Link>
        </nav>

        {/* Status & Actions */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-surface-500/10 border-surface-500/20'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-surface-500'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isConnected ? 'text-emerald-400' : 'text-surface-500'}`}>
              {isConnected ? 'Connected' : 'Searching'}
            </span>
            {isConnected ? (
              <Wifi size={14} className="text-emerald-500" />
            ) : (
              <WifiOff size={14} className="text-surface-500" />
            )}
          </div>

          <Link to="/create" className="btn-primary p-2 sm:px-4 sm:py-2 rounded-xl">
            <Plus size={20} className="sm:hidden" />
            <span className="hidden sm:inline-flex items-center gap-2">
              <Plus size={18} />
              Create Bucket
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
