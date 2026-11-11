import React, { useRef, useState } from 'react';
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
  Layers,
  CheckCircle2,
  Share2,
  RefreshCw,
  Loader2,
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
  const [aspectRatio, setAspectRatio] = useState<'4:5' | '1:1' | '9:16' | 'print'>('4:5');
  const [fileFormat, setFileFormat] = useState<'png' | 'jpg'>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!posterRef.current) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      // High-resolution image capture
      const options = {
        quality: 0.95,
        pixelRatio: 2, // 2x crisp rendering for high-res screens and prints
        cacheBust: true,
      };

      let dataUrl: string;
      if (fileFormat === 'png') {
        dataUrl = await toPng(posterRef.current, options);
      } else {
        dataUrl = await toJpeg(posterRef.current, options);
      }

      // Download file to user
      const link = document.createElement('a');
      const cleanTitle = (formData.title || 'إعلان_دعوي')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '');
      link.download = `أنصار_السنة_${cleanTitle}_${formData.date}.${fileFormat}`;
      link.href = dataUrl;
      link.click();

      // Also silently save announcement metadata to archive in database
      api.saveAnnouncement({
        ...formData,
      }).catch((e) => console.log('Saved locally:', e));

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (err) {
      console.error('Error exporting poster image:', err);
      alert('حدث خطأ أثناء تصدير الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-full md:w-96 bg-slate-900 border-b md:border-b-0 md:border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-amber-200 font-cairo flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                معاينة وتصدير الإعلان
              </h2>
              <p className="text-xs text-slate-400 font-tajawal mt-1">
                جاهز للتنزيل والنشر بجودة فائقة
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Template Switcher */}
          <div>
            <label className="text-xs font-bold text-amber-300 flex items-center gap-2 mb-2 font-cairo">
              <Layers className="w-4 h-4" />
              نمط وقالب التصميم:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setFormData((prev) => ({ ...prev, templateId: tpl.id }))}
                  className={`text-right p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    formData.templateId === tpl.id
                      ? 'border-amber-400 bg-amber-950/40 text-amber-200 font-bold shadow'
                      : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2 font-cairo">
              أبعاد ومقاس الإعلان:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setAspectRatio('4:5')}
                className={`p-2.5 rounded-lg border text-center transition-colors ${
                  aspectRatio === '4:5'
                    ? 'border-amber-400 bg-amber-950/30 text-amber-200 font-bold'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400'
                }`}
              >
                1080 × 1350 (افتراضي)
              </button>
              <button
                onClick={() => setAspectRatio('1:1')}
                className={`p-2.5 rounded-lg border text-center transition-colors ${
                  aspectRatio === '1:1'
                    ? 'border-amber-400 bg-amber-950/30 text-amber-200 font-bold'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400'
                }`}
              >
                1080 × 1080 (مربع)
              </button>
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`p-2.5 rounded-lg border text-center transition-colors ${
                  aspectRatio === '9:16'
                    ? 'border-amber-400 bg-amber-950/30 text-amber-200 font-bold'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400'
                }`}
              >
                1080 × 1920 (قصة/ستوري)
              </button>
              <button
                onClick={() => setAspectRatio('print')}
                className={`p-2.5 rounded-lg border text-center transition-colors ${
                  aspectRatio === 'print'
                    ? 'border-amber-400 bg-amber-950/30 text-amber-200 font-bold'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400'
                }`}
              >
                1200 × 1500 (طباعة بوستر)
              </button>
            </div>
          </div>

          {/* Export Format Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2 font-cairo">
              صيغة الملف:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFileFormat('png')}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${
                  fileFormat === 'png'
                    ? 'border-amber-400 bg-amber-950/40 text-amber-200'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400'
                }`}
              >
                PNG (دقة عالية وألوان نقية)
              </button>
              <button
                onClick={() => setFileFormat('jpg')}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${
                  fileFormat === 'jpg'
                    ? 'border-amber-400 bg-amber-950/40 text-amber-200'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400'
                }`}
              >
                JPG (حجم خفيف للنشر)
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          {exportSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>تم تصدير الإعلان وتنزيله بنجاح!</span>
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.99] disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري المعالجة والتصدير...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                تنزيل التصميم ({fileFormat.toUpperCase()})
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onReset();
                onClose();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              إنشاء إعلان جديد
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-800 text-slate-300 text-xs font-medium"
            >
              تعديل البيانات
            </button>
          </div>
        </div>
      </div>

      {/* Main Preview Viewport */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center bg-slate-950/80">
        <div className="max-w-full max-h-full flex items-center justify-center shadow-2xl rounded-2xl overflow-hidden border border-slate-800">
          {/* We scale the 1080px wide canvas to fit nicely into viewport */}
          <div className="transform scale-[0.45] md:scale-[0.55] lg:scale-[0.62] xl:scale-[0.70] origin-center transition-transform">
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
