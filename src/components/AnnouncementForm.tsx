import React, { useState, useEffect } from 'react';
import {
  AnnouncementFormData,
  AnnouncementType,
  TimeType,
  Sheikh,
  Mosque,
  State,
  Locality,
  MultiSession,
} from '../types';
import { getArabicDayName, isFriday, toHijriDate } from '../utils/hijri';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  Radio,
  BookOpen,
  Info,
  CheckCircle,
} from 'lucide-react';

interface AnnouncementFormProps {
  formData: AnnouncementFormData;
  setFormData: React.Dispatch<React.SetStateAction<AnnouncementFormData>>;
  sheikhs: Sheikh[];
  states: State[];
  localities: Locality[];
  mosques: Mosque[];
  onGenerateDesign: () => void;
}

export function AnnouncementForm({
  formData,
  setFormData,
  sheikhs,
  states,
  localities,
  mosques,
  onGenerateDesign,
}: AnnouncementFormProps) {
  const [fridayError, setFridayError] = useState<string | null>(null);

  // Filter localities by selected state
  const availableLocalities = formData.stateId
    ? localities.filter((loc) => loc.state_id === formData.stateId)
    : [];

  // Filter mosques by selected state and locality
  const availableMosques = mosques.filter((m) => {
    if (formData.stateId && m.state_id !== formData.stateId) return false;
    if (formData.localityId && m.locality_id !== formData.localityId) return false;
    return true;
  });

  // Selected primary sheikh
  const primarySheikh = sheikhs.find((s) => s.id === formData.primarySheikhId);

  // Synchronize Day Name and validate Friday on date change
  useEffect(() => {
    if (formData.date) {
      const dayName = getArabicDayName(formData.date);
      const hijri = toHijriDate(formData.date);

      if (formData.type === 'خطبة جمعة') {
        if (!isFriday(formData.date)) {
          setFridayError('تنبيه: نوع الإعلان "خطبة جمعة" يتطلب اختيار يوم الجمعة حصراً. يرجى اختيار تاريخ يوافق يوم الجمعة.');
        } else {
          setFridayError(null);
        }
      } else {
        setFridayError(null);
      }

      setFormData((prev) => ({
        ...prev,
        dayName,
        hijriDate: hijri,
      }));
    }
  }, [formData.date, formData.type]);

  // When announcement type changes, auto-select a fitting template
  const handleTypeChange = (newType: AnnouncementType) => {
    let recommendedTemplate = 'golden-heritage';
    if (newType === 'خطبة جمعة') recommendedTemplate = 'emerald-turquoise';
    else if (newType === 'محاضرة كبرى') recommendedTemplate = 'golden-heritage';
    else if (newType === 'ملتقى دعوي' || newType === 'ندوة علمية') recommendedTemplate = 'official-blue';
    else if (newType === 'دورة علمية' || newType === 'برنامج دراسة المتون العلمية') recommendedTemplate = 'classic-islamic';
    else if (newType === 'جدول برامج') recommendedTemplate = 'modern-geometric';

    // Set default Friday if switching to Friday sermon and current date isn't Friday
    let newDate = formData.date;
    if (newType === 'خطبة جمعة' && !isFriday(newDate)) {
      // Find upcoming Friday
      const d = new Date();
      const day = d.getDay();
      const diff = (5 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      newDate = d.toISOString().slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      type: newType,
      templateId: recommendedTemplate,
      date: newDate,
    }));
  };

  // Add co-sheikh
  const handleAddSecondarySheikh = (sheikhId: number) => {
    if (sheikhId && !formData.secondarySheikhIds.includes(sheikhId) && sheikhId !== formData.primarySheikhId) {
      setFormData((prev) => ({
        ...prev,
        secondarySheikhIds: [...prev.secondarySheikhIds, sheikhId],
      }));
    }
  };

  // Remove co-sheikh
  const handleRemoveSecondarySheikh = (sheikhId: number) => {
    setFormData((prev) => ({
      ...prev,
      secondarySheikhIds: prev.secondarySheikhIds.filter((id) => id !== sheikhId),
    }));
  };

  // Multi-session timetable helpers
  const handleAddSession = () => {
    const newSession: MultiSession = {
      id: Math.random().toString(),
      day: 'السبت',
      date: formData.date || '',
      time: 'بعد صلاة المغرب',
      sheikhName: primarySheikh ? `${primarySheikh.title} ${primarySheikh.short_name}` : '',
      topic: '',
    };
    setFormData((prev) => ({
      ...prev,
      multiSessions: [...prev.multiSessions, newSession],
    }));
  };

  const handleUpdateSession = (id: string, field: keyof MultiSession, value: string) => {
    setFormData((prev) => ({
      ...prev,
      multiSessions: prev.multiSessions.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  const handleRemoveSession = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      multiSessions: prev.multiSessions.filter((s) => s.id !== id),
    }));
  };

  const isMultiSessionType = [
    'برنامج دعوي',
    'دورة علمية',
    'برنامج دراسة المتون العلمية',
    'جدول برامج',
  ].includes(formData.type);

  const canSubmit = !fridayError && formData.title && formData.primarySheikhId && formData.date;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-sm max-w-4xl mx-auto">
      {/* Form Header */}
      <div className="text-center pb-8 border-b border-slate-800">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          النظام الآلي لتوليد التصاميم الدعوية
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-white font-cairo">
          إنشاء إعلان دعوي جديد
        </h2>
        <p className="text-sm text-slate-400 mt-2 font-tajawal max-w-xl mx-auto">
          اختر نوع الإعلان والشيخ والمسجد والتاريخ، وسيقوم النظام بتنسيق المخطوطات والصور والشعارات الرسمية تلقائياً.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        {/* ==================================================== */}
        {/* 1. نوع الإعلان (Announcement Type) */}
        {/* ==================================================== */}
        <div>
          <label className="text-sm font-bold text-amber-200 block mb-2 font-cairo">
            1. نوع الإعلان الدعوي: <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {(
              [
                'خطبة جمعة',
                'محاضرة كبرى',
                'محاضرة عامة',
                'برنامج دعوي',
                'دورة علمية',
                'برنامج دراسة المتون العلمية',
                'ندوة علمية',
                'ملتقى دعوي',
                'جدول برامج',
                'إعلان آخر',
              ] as AnnouncementType[]
            ).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={`py-3 px-3 rounded-xl border text-xs font-bold font-tajawal transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                  formData.type === t
                    ? 'border-amber-400 bg-amber-950/50 text-amber-200 shadow-md ring-1 ring-amber-400/50'
                    : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ==================================================== */}
        {/* 2. اختيار الشيخ (Sheikh Selection) */}
        {/* ==================================================== */}
        <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800">
          <label className="text-sm font-bold text-amber-200 flex items-center gap-2 mb-3 font-cairo">
            <User className="w-4 h-4 text-amber-400" />
            2. اختيار الشيخ أو الداعية: <span className="text-red-400">*</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <select
                value={formData.primarySheikhId || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    primarySheikhId: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400 font-cairo"
              >
                <option value="">-- اختر الشيخ من القائمة المعتمدة --</option>
                {sheikhs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} {s.full_name} ({s.short_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Sheikh Info Preview Card */}
            {primarySheikh && (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/80 border border-amber-500/20">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400/40 overflow-hidden shrink-0 flex items-center justify-center">
                  {primarySheikh.photo_url ? (
                    <img
                      src={primarySheikh.photo_url}
                      alt={primarySheikh.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-amber-400" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-amber-300 font-cairo truncate">
                    {primarySheikh.title} {primarySheikh.full_name}
                  </div>
                  <div className="text-xs text-slate-400 font-tajawal truncate">
                    {primarySheikh.role_description || 'داعية وباحث إسلامي'}
                  </div>
                  {primarySheikh.calligraphy_url && (
                    <span className="text-[10px] text-emerald-400 font-medium">
                      ✓ المخطوطة الرسمية متوفرة
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Co-Sheikhs Option */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300">
                هل يتضمن الإعلان مشايخ آخرين أو مشاركين؟
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddSecondarySheikh(Number(e.target.value));
                    e.target.value = '';
                  }
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
              >
                <option value="">+ إضافة شيخ مشارك...</option>
                {sheikhs
                  .filter((s) => s.id !== formData.primarySheikhId && !formData.secondarySheikhIds.includes(s.id))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} {s.short_name}
                    </option>
                  ))}
              </select>

              {formData.secondarySheikhIds.map((id) => {
                const s = sheikhs.find((item) => item.id === id);
                if (!s) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-slate-900 border border-amber-500/30 text-amber-200"
                  >
                    <span>{s.title} {s.short_name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSecondarySheikh(id)}
                      className="text-slate-400 hover:text-red-400 ml-1"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 3 & 4. الموقع الجغرافي والمسجد (Location & Mosque) */}
        {/* ==================================================== */}
        <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-4">
          <label className="text-sm font-bold text-amber-200 flex items-center gap-2 font-cairo">
            <MapPin className="w-4 h-4 text-amber-400" />
            3. الموقع الجغرافي والمسجد:
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* الولاية */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">الولاية:</label>
              <select
                value={formData.stateId || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stateId: e.target.value ? Number(e.target.value) : null,
                    localityId: null,
                    mosqueId: null,
                  }))
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="">-- اختر الولاية --</option>
                {states.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* المحلية */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">المحلية:</label>
              <select
                value={formData.localityId || ''}
                disabled={!formData.stateId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    localityId: e.target.value ? Number(e.target.value) : null,
                    mosqueId: null,
                  }))
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 disabled:opacity-40"
              >
                <option value="">-- اختر المحلية --</option>
                {availableLocalities.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* المسجد */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">المسجد المعتمد:</label>
              <select
                value={formData.mosqueId || ''}
                disabled={!formData.localityId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mosqueId: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 disabled:opacity-40"
              >
                <option value="">-- اختر المسجد --</option>
                {availableMosques.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.area_neighborhood})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Missing mosque notice */}
          {formData.localityId && availableMosques.length === 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-tajawal">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>المسجد غير موجود في القائمة، يرجى التواصل مع الإدارة لإضافته.</span>
            </div>
          )}

          {/* Fallback custom location if needed */}
          {!formData.mosqueId && (
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                اسم المسجد أو المركز (في حال عدم وجوده بالقائمة):
              </label>
              <input
                type="text"
                placeholder="مثال: مجمع أنصار السنة الإسلامي، قاعة المحاضرات المركزية"
                value={formData.customLocation || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, customLocation: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* 5. التاريخ واليوم (Mandatory Friday Check) */}
        {/* ==================================================== */}
        <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-4">
          <label className="text-sm font-bold text-amber-200 flex items-center gap-2 font-cairo">
            <Calendar className="w-4 h-4 text-amber-400" />
            4. التاريخ واليوم: <span className="text-red-400">*</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Date Input */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">
                {formData.type === 'خطبة جمعة' ? 'تاريخ الجمعة (أيام الجمعة فقط):' : 'تاريخ الفعالية:'}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Auto Computed Day Name */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">اليوم (تلقائي):</label>
              <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-amber-300 font-cairo flex items-center justify-between">
                <span>{formData.dayName ? `يوم ${formData.dayName}` : 'لم يحدد بعد'}</span>
                {formData.type === 'خطبة جمعة' && formData.dayName === 'الجمعة' && (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>

            {/* Auto Computed Hijri Date */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">التاريخ الهجري (الموافق):</label>
              <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-amiri">
                {formData.hijriDate || 'يحسب تلقائياً مع التاريخ'}
              </div>
            </div>
          </div>

          {/* Friday Constraint Warning Error */}
          {fridayError && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs font-tajawal">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{fridayError}</span>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* 6. الوقت (Time Selection) */}
        {/* ==================================================== */}
        <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-4">
          <label className="text-sm font-bold text-amber-200 flex items-center gap-2 font-cairo">
            <Clock className="w-4 h-4 text-amber-400" />
            5. التوقيت والموعد:
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {(
              [
                'بعد صلاة الفجر',
                'بعد صلاة الظهر',
                'بعد صلاة العصر',
                'بعد صلاة المغرب',
                'بعد صلاة العشاء',
                'بعد صلاة الجمعة',
                'وقت محدد',
              ] as TimeType[]
            ).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, timeType: t }))}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold font-tajawal text-center transition-colors ${
                  formData.timeType === t
                    ? 'border-amber-400 bg-amber-950/40 text-amber-200'
                    : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Conditional Hour and Minute for "وقت محدد" */}
          {formData.timeType === 'وقت محدد' && (
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-slate-400">حدد الساعة والدقيقة:</span>
              <select
                value={formData.customTimeHour || '08'}
                onChange={(e) => setFormData((prev) => ({ ...prev, customTimeHour: e.target.value }))}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <span>:</span>
              <select
                value={formData.customTimeMinute || '00'}
                onChange={(e) => setFormData((prev) => ({ ...prev, customTimeMinute: e.target.value }))}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                {['00', '15', '30', '45'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={formData.customTimePeriod || 'م'}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customTimePeriod: e.target.value as 'ص' | 'م' }))
                }
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="م">مساءً</option>
                <option value="ص">صباحاً</option>
              </select>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* 7. المعلومات الإضافية حسب نوع الإعلان */}
        {/* ==================================================== */}
        <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-4">
          <label className="text-sm font-bold text-amber-200 flex items-center gap-2 font-cairo">
            <BookOpen className="w-4 h-4 text-amber-400" />
            6. تفاصيل وموضوع الإعلان: <span className="text-red-400">*</span>
          </label>

          <div className="space-y-4">
            {/* Main Title */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                {formData.type === 'خطبة جمعة'
                  ? 'عنوان خطبة الجمعة:'
                  : formData.type === 'دورة علمية'
                  ? 'اسم الدورة العلمية:'
                  : 'عنوان الإعلان أو المحاضرة:'}
              </label>
              <input
                type="text"
                placeholder={
                  formData.type === 'خطبة جمعة'
                    ? 'مثال: وجوب الاعتصام بالكتاب والسنة والتحذير من الفرقة'
                    : 'مثال: شرح كتاب التوحيد الذي هو حق الله على العبيد'
                }
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400 font-cairo"
              />
            </div>

            {/* Course Books and Texts (for courses & text programs) */}
            {(formData.type === 'دورة علمية' || formData.type === 'برنامج دراسة المتون العلمية') && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">المتون أو الكتب المقررة:</label>
                <input
                  type="text"
                  placeholder="مثال: الأصول الثلاثة، الأربعين النووية، العقيدة الواسطية"
                  value={formData.booksAndTexts || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, booksAndTexts: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            {/* Symposium themes or notes */}
            {formData.type === 'ندوة علمية' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">محاور الندوة العلمية:</label>
                <input
                  type="text"
                  placeholder="مثال: المحور الأول: فضل العلم، المحور الثاني: شبهات والرد عليها"
                  value={formData.symposiumThemes || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, symposiumThemes: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            {/* Additional Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">ملاحظة أسفل الإعلان (اختياري):</label>
                <input
                  type="text"
                  placeholder="مثال: الدعوة عامة للمسلمين والمسلمات | توجد وجبة عشاء"
                  value={formData.specialNotes || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, specialNotes: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-5">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.liveBroadcast || false}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, liveBroadcast: e.target.checked }))
                    }
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>يوجد بث مباشر عبر وسائل التواصل</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.womenHallAvailable ?? true}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, womenHallAvailable: e.target.checked }))
                    }
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>يوجد مصلى ومكان للنساء</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 8. جدول المواعيد المتعددة (للبرامج والدورات) */}
        {/* ==================================================== */}
        {isMultiSessionType && (
          <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-amber-200 block font-cairo">
                  7. جدول مواعيد الجلسات والبرنامج:
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  أضف مواعيد الأيام أو المحاضرات المندرجة تحت هذا البرنامج
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSession}
                className="py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة موعد
              </button>
            </div>

            {formData.multiSessions.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                لم يتم إضافة مواعيد فرعية. يمكنك الضغط على "إضافة موعد" لجدولة الجلسات.
              </div>
            ) : (
              <div className="space-y-2.5">
                {formData.multiSessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-700 items-center text-xs"
                  >
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="اليوم (السبت)"
                        value={session.day}
                        onChange={(e) => handleUpdateSession(session.id, 'day', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <input
                        type="date"
                        value={session.date}
                        onChange={(e) => handleUpdateSession(session.id, 'date', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <input
                        type="text"
                        placeholder="الوقت (بعد صلاة المغرب)"
                        value={session.time}
                        onChange={(e) => handleUpdateSession(session.id, 'time', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <input
                        type="text"
                        placeholder="الشيخ أو الموضوع"
                        value={session.sheikhName || ''}
                        onChange={(e) => handleUpdateSession(session.id, 'sheikhName', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div className="md:col-span-1 text-left">
                      <button
                        type="button"
                        onClick={() => handleRemoveSession(session.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* SUBMIT BUTTON: GENERATE DESIGN */}
        {/* ==================================================== */}
        <div className="pt-4">
          <button
            type="button"
            onClick={onGenerateDesign}
            disabled={!canSubmit}
            className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-lg shadow-2xl shadow-amber-500/20 flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-6 h-6" />
            إنشاء التصميم الآن ومعاينته
          </button>
          {!canSubmit && (
            <p className="text-center text-xs text-slate-400 mt-2 font-tajawal">
              يرجى إكمال الحقول الإلزامية (نوع الإعلان، الشيخ، العنوان، وتاريخ صحيح) لتوليد التصميم.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
