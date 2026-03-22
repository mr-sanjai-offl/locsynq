import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, ArrowLeft, Shield, Globe, Clock, Info, ChevronRight } from 'lucide-react';
import { bucketApi } from '../services/api';
import { useBucketStore } from '../stores/bucketStore';

export function CreateBucketPage() {
  const navigate = useNavigate();
  const loadBuckets = useBucketStore(s => s.fetchBuckets);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'public' | 'pin-protected' | 'temporary'>('public');
  const [pin, setPin] = useState('');
  const [expiresInMinutes, setExpiresInMinutes] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await bucketApi.create({
        name,
        mode,
        pin: mode === 'pin-protected' ? pin : undefined,
        expiresInMinutes: mode === 'temporary' ? expiresInMinutes : undefined
      });

      if (result.ownerToken) {
        localStorage.setItem(`owner_token_${result.bucket.id}`, result.ownerToken);
      }

      await loadBuckets();
      navigate(`/bucket/${result.bucket.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create bucket');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-surface-400 hover:text-white transition-colors mb-4 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Database size={24} className="text-primary-400" />
          Create New Bucket
        </h1>
        <p className="text-surface-400 mt-1">Set up a bucket to share files, text, and links</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center gap-3 animate-shake">
            <Info size={18} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <label htmlFor="name" className="block text-sm font-medium text-surface-300 ml-1">
            Bucket Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Lab Resources, Team Shares"
            className="input-field"
            required
            autoFocus
          />
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-surface-300 ml-1">
            Access Mode
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setMode('public')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                mode === 'public' ? 'bg-primary-500/10 border-primary-500 text-white' : 'bg-white/5 border-white/5 text-surface-500 hover:bg-white/10'
              }`}
            >
              <Globe size={20} />
              <span className="text-sm font-medium">Public</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('pin-protected')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                mode === 'pin-protected' ? 'bg-primary-500/10 border-primary-500 text-white' : 'bg-white/5 border-white/5 text-surface-500 hover:bg-white/10'
              }`}
            >
              <Shield size={20} />
              <span className="text-sm font-medium">PIN Protected</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('temporary')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                mode === 'temporary' ? 'bg-primary-500/10 border-primary-500 text-white' : 'bg-white/5 border-white/5 text-surface-500 hover:bg-white/10'
              }`}
            >
              <Clock size={20} />
              <span className="text-sm font-medium">Temporary</span>
            </button>
          </div>
        </div>

        {mode === 'pin-protected' && (
          <div className="space-y-4 animate-fade-in">
            <label htmlFor="pin" className="block text-sm font-medium text-surface-300 ml-1">
              Access PIN (4-digit)
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              pattern="[0-9]{4}"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="0000"
              className="input-field text-center text-2xl tracking-[1em]"
              required
            />
          </div>
        )}

        {mode === 'temporary' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center ml-1">
              <label htmlFor="expiry" className="block text-sm font-medium text-surface-300">
                Expires In
              </label>
              <span className="text-primary-400 font-bold">
                {expiresInMinutes >= 60 ? `${Math.floor(expiresInMinutes/60)}h ${expiresInMinutes%60}m` : `${expiresInMinutes}m`}
              </span>
            </div>
            <input
              id="expiry"
              type="range"
              min="5"
              max="480"
              step="5"
              value={expiresInMinutes}
              onChange={(e) => setExpiresInMinutes(Number(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-xs text-surface-500">
              <span>5 min</span>
              <span>8 hours</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !name.trim() || (mode === 'pin-protected' && pin.length !== 4)}
          className="btn-primary w-full py-4 rounded-xl mt-4"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Create Bucket</span>
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
