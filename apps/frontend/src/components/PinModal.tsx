import { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { authApi } from '../services/api';

interface PinModalProps {
  bucketId: string;
  bucketName: string;
  onSuccess: (token: string) => void;
  onClose: () => void;
}

export function PinModal({ bucketId, bucketName, onSuccess, onClose }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await authApi.authenticate(bucketId, pin);
      sessionStorage.setItem('bucketToken', result.token);
      onSuccess(result.token);
    } catch (err: any) {
      setError(err.message || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="pin-modal">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-strong rounded-2xl p-6 w-full max-w-sm animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-surface-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
            <Lock size={24} className="text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Protected Bucket</h3>
          <p className="text-sm text-surface-400 mt-1">
            Enter the PIN to access <span className="text-white font-medium">{bucketName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="input-field text-center text-lg tracking-widest"
              autoFocus
              id="pin-input"
            />
          </div>

          {error && (
            <p className="text-sm text-rose-400 text-center animate-fade-in">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="btn-primary w-full"
            id="pin-submit"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying...
              </span>
            ) : (
              'Unlock'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
