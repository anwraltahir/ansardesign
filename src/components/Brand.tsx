import React, { useState } from 'react';
import { AnsarLogoSvg } from './DesignEngine/IslamicDecorations';

// Official brand files live in /public/brand (served at /brand/...)
const EMBLEM_SRC = '/brand/emblem.png';
const WORDMARK_SRC = '/brand/wordmark.png';

interface BrandEmblemProps {
  className?: string;
  // Logo uploaded from the admin "visual identity" tab takes priority
  customUrl?: string;
}

export function BrandEmblem({ className = 'h-12 w-12', customUrl }: BrandEmblemProps) {
  const sources = [customUrl, EMBLEM_SRC].filter(Boolean) as string[];
  const [index, setIndex] = useState(0);

  if (index >= sources.length) {
    return <AnsarLogoSvg className={className} />;
  }

  return (
    <img
      src={sources[index]}
      alt="شعار جماعة أنصار السنة المحمدية بالسودان"
      className={`${className} object-contain`}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}

// Calligraphic "جماعة أنصار السنة المحمدية بالسودان – أمانة الدعوة" lockup
export function BrandWordmark({ className = 'h-24' }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="text-center text-brand-700">
        <div className="font-amiri font-bold text-2xl sm:text-4xl leading-snug">
          جماعة أنصار السنة المحمدية بالسودان
        </div>
        <div className="font-display font-bold text-lg sm:text-2xl mt-1 tracking-wide">أمانة الدعوة</div>
      </div>
    );
  }

  return (
    <img
      src={WORDMARK_SRC}
      alt="جماعة أنصار السنة المحمدية بالسودان – أمانة الدعوة"
      className={`${className} w-auto max-w-full object-contain`}
      onError={() => setFailed(true)}
    />
  );
}
