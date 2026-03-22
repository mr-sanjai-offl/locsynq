import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bucket, Globe, Lock, Clock, Sparkles } from 'lucide-react';
import { bucketApi } from '../services/api';
import { useBucketStore } from '../stores/bucketStore';

type BucketMode = 'public' | 'pin-protected' | 'temporary';

export function CreateBucketPage() {
  const navigate = useNavigate();
  const { addBucket } = useBucketStore();
  const [name, setName] = useState('');
  const [mode, setMode] = useState<BucketMode>('public');
  const [pin, setPin] = useState('');
  const [expiresInMinutes, setExpiresInMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await bucketApi.create({
        name: name.trim(),
        mode,
        ...(mode === 'pin-protected' ? { pin } : {}),
        ...(mode === 'temporary' ? { expiresInMinutes } : {}),
      });

      // Store owner token
      sessionStorage.setItem(`ownerToken_${result.bucket.id}`, result.ownerToken);
      sessionStorage.setItem('bucketToken', result.ownerToken);

      addBucket(result.bucket);
      navigate(`/bucket/${result.bucket.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create bucket');
    } finally {
      setLoading(false);
    }
  };

  const modeOptions: { value: BucketMode; icon: React.ReactNode; label: string; desc: string }[] = [
    { value: 'public', icon: <Globe size={20} />, label: 'Public', desc: 'Anyone on the network can access' },
    { value: 'pin-protected', icon: <Lock size={20} />, label: 'PIN Protected', desc: 'Requires a PIN to access' },
    { value: 'temporary', icon: <Clock size={20} />, label: 'Temporary', desc: 'Auto-expires after a set time' },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate(-1)} className="btn-ghost mb-4">
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles size={24} className="text-primary-400" />
          Create New Bucket
        </h1>
        <p className="text-surface-400 mt-1">Set up a bucket to share files, text, and links</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bucket Name */}
        <div className="space-y-2">
          <label htmlFor="bucket-name" className="text-sm font-medium text-surface-300">Bucket Name</label>
          <input
            id="bucket-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Lab Resources, Meeting Files..."
            className="input-field"
            maxLength={100}
            required
            autoFocus
          />
        </div>

        {/* Mode Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-surface-300">Access Mode</label>
          <div className="grid gap-3">
            {modeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMode(opt.value)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left
                  ${mode === opt.value
                    ? 'border-primary-500/50 bg-primary-500/10 shadow-lg shadow-primary-500/5'
                    : 'border-white/10 bg-white/5 hover:bg-white/[0.07] hover:border-white/15'
                  }
                `}
                id={`mode-${opt.value}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  mode === opt.value ? 'bg-primary-500/20 text-primary-400' : 'bg-white/5 text-surface-400'
                }`}>
                  {opt.icon}
                </div>
                <div>
                  <p className={`font-medium ${mode === opt.value ? 'text-white' : 'text-surface-300'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* PIN Input */}
        {mode === 'pin-protected' && (
          <div className="space-y-2 animate-slide-up">
            <label htmlFor="bucket-pin" className="text-sm font-medium text-surface-300">Set PIN</label>
            <input
              id="bucket-pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="4-20 character PIN"
              className="input-field"
              minLength={4}
              maxLength={20}
              required
            />
          </div>
        )}

        {/* Expiry Setting */}
        {mode === 'temporary' && (
          <div className="space-y-2 animate-slide-up">
            <label htmlFor="bucket-expiry" className="text-sm font-medium text-surface-300">
              Expire After: <span className="text-primary-400">{expiresInMinutes} minutes</span>
            </label>
            <input
              id="bucket-expiry"
              type="range"
              min={5}
              max={480}
              step={5}
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

        {/* Error */}
        {error && (
          <p className="text-sm text-rose-400 animate-fade-in">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !name.trim() || (mode === 'pin-protected' && pin.length < 4)}
          className="btn-primary w-full py-3 text-base"
          id="create-bucket-btn"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating...
            </span>
          ) : (
            'Create Bucket'
          )}
        </button>
      </form>
    </div>
  );
}
