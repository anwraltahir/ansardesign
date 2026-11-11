import React, { useState } from 'react';
import { ImagePlus, Loader2, Star, X } from 'lucide-react';
import { api } from '../../services/api';

interface PhotoGalleryFieldProps {
  label: string;
  // First photo is the main one
  photos: string[];
  onChange: (update: (photos: string[]) => string[]) => void;
  category: 'sheikhs' | 'mosques';
  onUploadingChange?: (uploading: boolean) => void;
  showMsg: (text: string, type?: 'success' | 'error') => void;
}

// Multi-photo picker for admin forms: upload several at once, pick the main one (★), remove any
export function PhotoGalleryField({ label, photos, onChange, category, onUploadingChange, showMsg }: PhotoGalleryFieldProps) {
  const [uploading, setUploading] = useState(0);

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(files.length);
    onUploadingChange?.(true);
    let uploaded = 0;
    for (const file of files) {
      try {
        const res = await api.uploadFile(file, category);
        uploaded++;
        onChange((prev) => [...prev, res.url]);
      } catch (err: any) {
        showMsg(`تعذر رفع ${file.name}: ${err.message}`, 'error');
      }
      setUploading((n) => n - 1);
    }
    onUploadingChange?.(false);
    if (uploaded > 0) showMsg(`تم رفع ${uploaded} ${uploaded === 1 ? 'صورة' : 'صور'} بنجاح`);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className="text-slate-300">
          {label} ({photos.length}):
        </label>
        <span className="text-[11px] text-slate-500">الصورة المميزة بـ ★ هي الرئيسية</span>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
          {photos.map((url, i) => (
            <div
              key={url}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 bg-slate-800 ${
                i === 0 ? 'border-brand-400' : 'border-slate-700'
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              {i === 0 ? (
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-brand-500 text-on-brand text-[10px] font-bold">
                  ★ الرئيسية
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onChange((prev) => [url, ...prev.filter((p) => p !== url)])}
                  className="absolute bottom-1 right-1 w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
                  title="تعيين كصورة رئيسية"
                  aria-label="تعيين كصورة رئيسية"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onChange((prev) => prev.filter((p) => p !== url))}
                className="absolute top-1 left-1 w-7 h-7 rounded-lg bg-black/60 hover:bg-red-600 text-white flex items-center justify-center"
                title="حذف الصورة"
                aria-label="حذف الصورة"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        className={`flex items-center justify-center gap-2 min-h-12 px-3 py-3 rounded-xl border-2 border-dashed text-xs font-bold transition-colors ${
          uploading > 0
            ? 'border-slate-700 text-slate-500 cursor-wait'
            : 'border-slate-700 hover:border-brand-400 text-brand-300 cursor-pointer'
        }`}
      >
        {uploading > 0 ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            جاري رفع {uploading} {uploading === 1 ? 'صورة' : 'صور'}...
          </>
        ) : (
          <>
            <ImagePlus className="w-4 h-4" />
            إضافة صور (يمكنك اختيار أكثر من صورة)
          </>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading > 0}
          className="sr-only"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            e.target.value = '';
            handleUpload(files);
          }}
        />
      </label>
    </div>
  );
}
