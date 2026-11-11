import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { PosterCanvas } from './DesignEngine/PosterCanvas';
import {
  AnnouncementFormData,
  Sheikh,
  Mosque,
  State,
  Locality,
  VisualIdentity,
  DesignTemplate,
} from '../types';
import {
  Download,
  X,
  Sparkles,
  CheckCircle2,
  Share2,
  RefreshCw,
  Loader2,
  Pencil,
} from 'lucide-react';
import { api } from '../services/api';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
  formData: AnnouncementFormData;
  setFormData: React.Dispatch<React.SetStateAction<AnnouncementFormData>>;
  primarySheikh?: Sheikh | null;
  secondarySheikhs?: Sheikh[];
  mosque?: Mosque | null;
  state?: State | null;
  locality?: Locality | null;
  identity?: VisualIdentity | null;
  templates: DesignTemplate[];
}

type AspectRatio = '4:5' | '1:1' | '9:16' | 'print';

const ASPECT_OPTIONS: { id: AspectRatio; size: string; label: string }[] = [
  { id: '4:5', size: '1080 × 1350', label: 'افتراضي' },
  { id: '1:1', size: '1080 × 1080', label: 'مربع' },
  { id: '9:16', size: '1080 × 1920', label: 'قصة/ستوري' },
  { id: 'print', size: '1200 × 1500', label: 'طباعة بوستر' },
];

// Feature-detect sharing image files (mobile browsers via the Web Share API)
function canShareFiles(): boolean {
  try {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [new File([''], 'test.png', { type: 'image/png' })] })
    );
  } catch {
    return false;
  }
}

export function PreviewModal({
  isOpen,
  onClose,
  onReset,
  formData,
  setFormData,
  primarySheikh,
  secondarySheikhs,
  mosque,
  state,
  locality,
  identity,
  templates,
}: PreviewModalProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');
  const [fileFormat, setFileFormat] = useState<'png' | 'jpg'>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [posterSize, setPosterSize] = useState({ width: 1080, height: 1350, scale: 0.3 });
  const [shareSupported] = useState(canShareFiles);

  // Fit the fixed-size poster canvas inside the available preview area
  useLayoutEffect(() => {
    if (!isOpen) return;
    const viewport = viewportRef.current;
    const poster = posterRef.current;
    if (!viewport || !poster) return;

    const update = () => {
      const width = poster.offsetWidth;
      const height = poster.offsetHeight;
      const padding = window.innerWidth < 768 ? 24 : 64;
      const scale = Math.min(
        (viewport.clientWidth - padding) / width,
        (viewport.clientHeight - padding) / height,
        1
      );
      setPosterSize({ width, height, scale: Math.max(scale, 0.05) });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    observer.observe(poster);
    return () => observer.disconnect();
  }, [isOpen, aspectRatio]);

  // Lock background scroll and allow closing with Escape
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Friday sermons have no announced title; they're filed under the type itself
  const effectiveTitle = formData.type === 'خطبة جمعة' ? 'خطبة الجمعة' : formData.title;

  const getFileName = () => {
    const cleanTitle = (effectiveTitle || 'إعلان_دعوي')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_؀-ۿ]/g, '');
    return `أنصار_السنة_${cleanTitle}_${formData.date}.${fileFormat}`;
  };

  // High-resolution image capture of the unscaled poster node
  const renderPoster = async (): Promise<string> => {
    const options = {
      quality: 0.95,
      pixelRatio: 2, // 2x crisp rendering for high-res screens and prints
      cacheBust: true,
    };
    const dataUrl =
      fileFormat === 'png'
        ? await toPng(posterRef.current!, options)
        : await toJpeg(posterRef.current!, options);

    // Also silently save announcement metadata to archive in database
    api.saveAnnouncement({ ...formData, title: effectiveTitle }).catch((e) => console.log('Saved locally:', e));
    return dataUrl;
  };

  const flashSuccess = (text: string) => {
    setExportSuccess(text);
    setTimeout(() => setExportSuccess(null), 3500);
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;
    setIsExporting(true);
    setExportSuccess(null);

    try {
      const dataUrl = await renderPoster();
      const link = document.createElement('a');
      link.download = getFileName();
      link.href = dataUrl;
      link.click();
      flashSuccess('تم تصدير الإعلان وتنزيله بنجاح!');
    } catch (err) {
      console.error('Error exporting poster image:', err);
      alert('حدث خطأ أثناء تصدير الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!posterRef.current) return;
    setIsExporting(true);
    setExportSuccess(null);

    try {
      const dataUrl = await renderPoster();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], getFileName(), { type: blob.type });
      await navigator.share({ files: [file], title: effectiveTitle });
      flashSuccess('تمت مشاركة الإعلان بنجاح!');
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Error sharing poster image:', err);
        alert('تعذرت المشاركة. يمكنك تنزيل الصورة ثم مشاركتها يدوياً.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const optionClass = (active: boolean) =>
    `min-h-11 p-2.5 rounded-xl border text-xs transition-colors ${
      active
        ? 'border-brand-400 bg-brand-950/40 text-brand-200 font-bold shadow'
        : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 md:bg-slate-950/95 md:backdrop-blur-md flex flex-col md:flex-row overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="معاينة وتصدير الإعلان"
    >
      {/* Mobile header */}
      <header className="md:hidden shrink-0 flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-slate-900 border-b border-slate-800">
        <h2 className="text-base font-bold text-brand-200 font-display flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-400" />
          معاينة وتصدير الإعلان
        </h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
          aria-label="إغلاق المعاينة"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Preview viewport */}
      <div
        ref={viewportRef}
        className="shrink-0 h-[48svh] md:h-auto md:flex-1 md:order-2 flex items-center justify-center overflow-hidden bg-slate-950/80 bg-islamic-pattern"
      >
        <div
          className="relative shrink-0 rounded-lg md:rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-800"
          style={{
            width: posterSize.width * posterSize.scale,
            height: posterSize.height * posterSize.scale,
          }}
        >
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{ transform: `scale(${posterSize.scale})` }}
          >
            <PosterCanvas
              ref={posterRef}
              formData={formData}
              primarySheikh={primarySheikh}
              secondarySheikhs={secondarySheikhs}
              mosque={mosque}
              state={state}
              locality={locality}
              identity={identity}
              aspectRatio={aspectRatio}
              template={templates.find((t) => t.id === formData.templateId)}
            />
          </div>
        </div>
      </div>

      {/* Controls panel */}
      <aside className="flex-1 min-h-0 md:flex-none md:w-96 md:order-1 flex flex-col bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800">
        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between p-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-brand-200 font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              معاينة وتصدير الإعلان
            </h2>
            <p className="text-xs text-slate-400 font-tajawal mt-1">
              جاهز للتنزيل والنشر بجودة فائقة
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            aria-label="إغلاق المعاينة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 space-y-5 md:space-y-6">
          {/* Aspect Ratio Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2 font-cairo">
              أبعاد ومقاس الإعلان:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ASPECT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAspectRatio(opt.id)}
                  aria-pressed={aspectRatio === opt.id}
                  className={`${optionClass(aspectRatio === opt.id)} text-center leading-tight`}
                >
                  <span dir="ltr" className="block">{opt.size}</span>
                  <span className="block text-[11px] opacity-80 mt-0.5">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Export Format Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2 font-cairo">
              صيغة الملف:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFileFormat('png')}
                aria-pressed={fileFormat === 'png'}
                className={`${optionClass(fileFormat === 'png')} leading-tight`}
              >
                <span className="block font-bold">PNG</span>
                <span className="block text-[11px] opacity-80 mt-0.5">دقة عالية وألوان نقية</span>
              </button>
              <button
                onClick={() => setFileFormat('jpg')}
                aria-pressed={fileFormat === 'jpg'}
                className={`${optionClass(fileFormat === 'jpg')} leading-tight`}
              >
                <span className="block font-bold">JPG</span>
                <span className="block text-[11px] opacity-80 mt-0.5">حجم خفيف للنشر</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="shrink-0 px-4 pt-3 pb-safe md:p-6 border-t border-slate-800 space-y-2.5 md:space-y-3 bg-slate-900">
          {exportSuccess && (
            <div
              role="status"
              className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{exportSuccess}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex-1 min-h-12 py-3.5 px-4 rounded-xl bg-gradient-to-l from-brand-700 to-brand-500 hover:from-brand-600 hover:to-brand-400 text-on-brand font-black text-sm shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  تنزيل ({fileFormat.toUpperCase()})
                </>
              )}
            </button>
            {shareSupported && (
              <button
                onClick={handleShare}
                disabled={isExporting}
                className="min-h-12 px-4 rounded-xl border border-brand-500/40 bg-brand-500/10 hover:bg-brand-500/20 text-brand-200 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                aria-label="مشاركة الإعلان"
              >
                <Share2 className="w-5 h-5" />
                <span>مشاركة</span>
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onReset();
                onClose();
              }}
              className="flex-1 min-h-10 py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              إنشاء إعلان جديد
            </button>
            <button
              onClick={onClose}
              className="flex-1 min-h-10 py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              تعديل البيانات
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
