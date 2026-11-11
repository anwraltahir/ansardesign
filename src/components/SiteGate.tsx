import React, { useState } from 'react';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { BrandEmblem, BrandWordmark } from './Brand';

interface SiteGateProps {
  onUnlocked: () => void;
}

// Full-page password screen shown to visitors before the site loads any data
export function SiteGate({ onUnlocked }: SiteGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.siteLogin(password);
      onUnlocked();
    } catch (err: any) {
      setError(err.message);
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-reset min-h-screen relative overflow-hidden bg-gradient-to-b from-brand-900 via-brand-950 to-[#0b1630] text-white flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-islamic-geo opacity-[0.06] pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[520px] rounded-full bg-brand-500/25 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm text-center">
        <div className="flex justify-center">
          <BrandEmblem className="h-24 w-24 drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]" />
        </div>
        <div className="mt-5 flex justify-center">
          <BrandWordmark className="h-20 sm:h-24 brightness-0 invert" />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold font-display">المصمم الذكي</h1>
        <p className="mt-1 text-sm text-brand-100/70 font-tajawal">أدخل كلمة المرور للدخول إلى المنصة</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div className="relative">
            <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-300 pointer-events-none" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              autoFocus
              autoComplete="current-password"
              aria-label="كلمة مرور الموقع"
              className="w-full bg-white/10 border border-white/20 focus:border-brand-300 rounded-2xl pr-10 pl-4 py-3.5 text-base text-white placeholder:text-brand-100/50 outline-none"
            />
          </div>

          {error && (
            <div role="alert" className="flex items-center gap-2 p-3 rounded-xl bg-red-500/15 border border-red-400/40 text-red-100 text-xs text-right">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full min-h-12 rounded-2xl bg-white hover:bg-brand-50 text-brand-800 font-bold text-base shadow-xl shadow-black/25 inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
