import React from 'react';

// Bismillah Calligraphy vector representation
export function BismillahSvg({ className = 'h-8 text-amber-400' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 500 90" fill="currentColor">
      <path d="M70,45 Q90,20 110,45 T150,45 Q165,30 180,45 T210,40 Q230,15 250,45 T290,45 Q310,25 330,45 T370,40 Q390,15 410,45 T450,45 C460,45 470,35 480,45 C470,55 460,50 450,55 C430,65 410,50 390,55 C370,60 350,50 330,55 C310,60 290,50 270,55 C250,60 230,50 210,55 C190,60 170,50 150,55 C130,60 110,50 90,55 C70,60 50,50 30,55 C20,55 10,45 20,40 C30,35 50,70 70,45 Z" opacity="0.9" />
      {/* Arabic text styled for clarity */}
      <text x="250" y="55" textAnchor="middle" className="font-amiri font-bold text-3xl" fill="currentColor">
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </text>
    </svg>
  );
}

// Ansar Al Sunna Sudan Official Emblem / Logo SVG
export function AnsarLogoSvg({ className = 'h-16 w-16' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer Golden Ring */}
      <circle cx="100" cy="100" r="92" stroke="url(#goldGrad)" strokeWidth="5" />
      <circle cx="100" cy="100" r="84" stroke="url(#goldGrad)" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="100" cy="100" r="78" fill="#06221d" stroke="#d97706" strokeWidth="2" />
      
      {/* Islamic 8-pointed star base */}
      <polygon points="100,28 116,68 156,68 124,94 138,134 100,110 62,134 76,94 44,68 84,68" fill="url(#goldGrad)" opacity="0.35" />
      
      {/* Minaret and Open Quran */}
      <path d="M100 48 L104 65 L96 65 Z" fill="#fef3c7" />
      <rect x="98" y="65" width="4" height="28" fill="#fef3c7" />
      <path d="M82 108 C90 102 100 105 100 118 C100 105 110 102 118 108 L118 132 C110 126 100 128 100 140 C100 128 90 126 82 132 Z" fill="#fef08a" stroke="#b45309" strokeWidth="2" />
      
      {/* Emblem Arabic Text */}
      <text x="100" y="162" textAnchor="middle" fill="#fde68a" fontSize="12" fontWeight="bold" fontFamily="Cairo">
        أنصار السنة المحمدية
      </text>
      <text x="100" y="176" textAnchor="middle" fill="#ca8a04" fontSize="10" fontFamily="Cairo">
        السودان
      </text>
      
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Elegant Islamic Corner Ornament
export function CornerOrnament({ className = 'w-16 h-16 text-amber-500/80' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor">
      <path d="M0,0 L0,80 C10,75 25,60 30,45 C35,30 45,25 60,20 C75,15 80,0 80,0 L0,0 Z" opacity="0.25" />
      <path d="M0,0 L0,60 C15,55 25,45 35,35 C45,25 55,15 60,0 L0,0 Z" opacity="0.4" />
      <circle cx="16" cy="16" r="4" />
      <circle cx="32" cy="12" r="2.5" />
      <circle cx="12" cy="32" r="2.5" />
      <line x1="0" y1="0" x2="85" y2="0" stroke="currentColor" strokeWidth="4" />
      <line x1="0" y1="0" x2="0" y2="85" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}

// Geometric 8-Pointed Star
export function IslamicStar({ className = 'w-6 h-6 text-amber-400' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor">
      <polygon points="50,0 64,36 100,50 64,64 50,100 36,64 0,50 36,36" />
      <polygon points="50,14 60,39 86,50 60,61 50,86 40,61 14,50 40,39" fill="#0f172a" opacity="0.4" />
    </svg>
  );
}

// Mosque Skyline Silhouette
export function MosqueSkyline({ className = 'w-full h-24 text-amber-500/20' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1000 180" fill="currentColor" preserveAspectRatio="none">
      <path d="M0,180 L0,120 L80,120 L80,50 L95,20 L110,50 L110,120 L240,120 Q300,40 360,120 L480,120 L480,30 L500,5 L520,30 L520,120 L640,120 Q700,50 760,120 L890,120 L890,45 L905,15 L920,45 L920,120 L1000,120 L1000,180 Z" />
    </svg>
  );
}
