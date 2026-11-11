import React from 'react';
import { BrandEmblem } from './Brand';
import { VisualIdentity } from '../types';
import { Shield } from 'lucide-react';

interface NavbarProps {
  identity?: VisualIdentity | null;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
}

export function Navbar({ identity, onOpenAdmin, isAdminLoggedIn }: NavbarProps) {
  return (
    <header className="theme-reset sticky top-0 z-40 bg-brand-950/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-brand-950/20 pt-[env(safe-area-inset-top)]">
      {/* Brand accent strip */}
      <div className="h-1 bg-gradient-to-l from-brand-700 via-brand-300 to-brand-700" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Right: Logo and Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <BrandEmblem
            customUrl={identity?.group_logo_url}
            className="shrink-0 h-11 w-11 sm:h-14 sm:w-14 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
          />
          <div className="min-w-0 border-r border-white/15 pr-2.5 sm:pr-3">
            <div className="text-base sm:text-lg font-bold text-white font-display leading-tight whitespace-nowrap">
              المصمم الذكي
            </div>
            <p className="text-[11px] sm:text-xs text-brand-300 font-tajawal font-medium truncate">
              <span className="sm:hidden">أمانة الدعوة</span>
              <span className="hidden sm:inline">أمانة الدعوة – جماعة أنصار السنة المحمدية بالسودان</span>
            </p>
          </div>
        </div>

        {/* Left: Discreet Admin Entry */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Discreet Admin Lock Button */}
          <button
            onClick={onOpenAdmin}
            className={`min-h-11 min-w-11 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              isAdminLoggedIn
                ? 'bg-white text-brand-800 border-white shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-brand-100 hover:text-white border-white/15 hover:border-white/25'
            }`}
            title="لوحة إدارة المصمم الذكي (المسؤول)"
            aria-label={isAdminLoggedIn ? 'لوحة الإدارة' : 'دخول الإدارة'}
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
