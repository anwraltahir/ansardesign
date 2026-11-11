import React from 'react';
import { AnsarLogoSvg } from './DesignEngine/IslamicDecorations';
import { VisualIdentity } from '../types';
import { Shield, Sparkles } from 'lucide-react';

interface NavbarProps {
  identity?: VisualIdentity | null;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
}

export function Navbar({ identity, onOpenAdmin, isAdminLoggedIn }: NavbarProps) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Right: Logo and Branding */}
        <div className="flex items-center gap-3.5">
          <div className="shrink-0 drop-shadow">
            {identity?.group_logo_url ? (
              <img
                src={identity.group_logo_url}
                alt="شعار أنصار السنة"
                className="h-12 w-12 object-contain"
              />
            ) : (
              <AnsarLogoSvg className="h-12 w-12" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-white font-cairo">
                المصمم الذكي
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                أمانة الدعوة
              </span>
            </div>
            <p className="text-xs text-amber-400/80 font-tajawal hidden sm:block">
              جماعة أنصار السنة المحمدية بالسودان - منصة إنشاء الإعلانات والبرامج الدعوية
            </p>
          </div>
        </div>

        {/* Left: Domain Indicator & Discreet Admin Entry */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono dir-ltr">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            design.ansaralsuna.net
          </div>

          {/* Discreet Admin Lock Button */}
          <button
            onClick={onOpenAdmin}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isAdminLoggedIn
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
            }`}
            title="لوحة إدارة المصمم الذكي (المسؤول)"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isAdminLoggedIn ? 'لوحة الإدارة' : 'دخول الإدارة'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
