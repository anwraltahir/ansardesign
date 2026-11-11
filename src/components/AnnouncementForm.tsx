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
  DesignTemplate,
} from '../types';
import {
  formatGregorianArabic,
  getArabicDayName,
  getNextFridayISO,
  getUpcomingFridays,
  isFriday,
  toHijriDate,
} from '../utils/hijri';
import { getSheikhPhotos, pickSheikhPhoto } from '../utils/sheikh';
import { recommendTemplate } from '../utils/templates';
import { api } from '../services/api';
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
  templates: DesignTemplate[];
  isAdminLoggedIn: boolean;
  onSheikhsChanged: (sheikhs: Sheikh[]) => void;
  onGenerateDesign: () => void;
}

export function AnnouncementForm({
  formData,
  setFormData,
  sheikhs,
  states,
  localities,
  mosques,
  templates,
  isAdminLoggedIn,
  onSheikhsChanged,
  onGenerateDesign,
}: AnnouncementFormProps) {
  const [manualCoSheikh, setManualCoSheikh] = useState('');
  const [savingSheikh, setSavingSheikh] = useState(false);

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

  const isFridaySermon = formData.type === 'خطبة جمعة';
  const timeOptions: TimeType[] = isFridaySermon
    ? ['وقت صلاة الجمعة', 'وقت محدد']
    : [
        'بعد صلاة الفجر',
        'بعد صلاة الظهر',
        'بعد صلاة العصر',
        'بعد صلاة المغرب',
        'بعد صلاة العشاء',
        'بعد صلاة الجمعة',
        'وقت محدد',
      ];

  // Upcoming Fridays for sermons; keep an existing (e.g. archived) date selectable
  const upcomingFridays = getUpcomingFridays(12);
  const fridayOptions =
    formData.date && isFriday(formData.date) && !upcomingFridays.includes(formData.date)
      ? [formData.date, ...upcomingFridays]
      : upcomingFridays;

  // Selected primary sheikh
  const primarySheikh = sheikhs.find((s) => s.id === formData.primarySheikhId);
  const sheikhPhotos = getSheikhPhotos(primarySheikh);
  const selectedSheikhPhoto = pickSheikhPhoto(primarySheikh, formData.sheikhPhotoUrl);

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
    const recommendedTemplate = recommendTemplate(newType, templates);

    // Set default Friday if switching to Friday sermon and current date isn't Friday
    let newDate = formData.date;
    if (newType === 'خطبة جمعة' && !isFriday(newDate)) {
      newDate = getNextFridayISO();
    }

    setFormData((prev) => ({
      ...prev,
      type: newType,
      templateId: recommendedTemplate,
      date: newDate,
      // A sermon is part of the Friday prayer, so "after Friday prayer" doesn't apply to it
      timeType:
        newType === 'خطبة جمعة'
          ? prev.timeType === 'وقت محدد'
            ? 'وقت محدد'
            : 'وقت صلاة الجمعة'
          : prev.timeType === 'وقت صلاة الجمعة'
          ? 'بعد صلاة المغرب'
          : prev.timeType,
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

  // Admins can promote a typed-in sheikh to the approved list
  const handleSaveManualSheikh = async () => {
    const manual = formData.manualSheikh;
    if (!manual?.name.trim()) return;
    setSavingSheikh(true);
    try {
      const { sheikh } = await api.saveSheikh({
        full_name: manual.name.trim(),
        short_name: manual.name.trim(),
        title: manual.title.trim(),
        role_description: manual.role.trim(),
        is_active: true,
      });
      onSheikhsChanged(await api.getSheikhs());
      setFormData((prev) => ({ ...prev, primarySheikhId: sheikh.id, manualSheikh: undefined }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingSheikh(false);
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

  // Everything the poster needs; the generate button stays disabled until this list is empty
  const missingFields = [
    !formData.primarySheikhId && !formData.manualSheikh?.name.trim() && 'الشيخ',
    !formData.mosqueId && !formData.customLocation?.trim() && 'المسجد أو مكان الإقامة',
    (!formData.date || fridayError) && (isFridaySermon ? 'تاريخ جمعة صحيح' : 'التاريخ'),
    !isFridaySermon && !formData.title.trim() && (formData.type === 'دورة علمية' ? 'اسم الدورة' : 'العنوان'),
    (formData.type === 'دورة علمية' || formData.type === 'برنامج دراسة المتون العلمية') &&
      !formData.booksAndTexts?.trim() &&
      'المتون أو الكتب المقررة',
    formData.type === 'ندوة علمية' && !formData.symposiumThemes?.trim() && 'محاور الندوة',
    isMultiSessionType &&
      formData.multiSessions.some((session) => !session.day.trim() || !session.time.trim()) &&
      'يوم ووقت كل جلسة في الجدول',
  ].filter(Boolean) as string[];
  const canSubmit = missingFields.length === 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 shadow-2xl backdrop-blur-sm max-w-4xl mx-auto">
      {/* Form Header */}
      <div className="text-center pb-6 sm:pb-8 border-b border-slate-800">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-display">
          إنشاء إعلان دعوي جديد
        </h2>
        <p className="text-sm text-slate-400 mt-2 font-tajawal max-w-xl mx-auto">
          اختر نوع الإعلان والشيخ والمسجد والتاريخ، وسيقوم النظام بتنسيق المخطوطات والصور والشعارات الرسمية تلقائياً.
        </p>
      </div>

      <div className="mt-6 sm:mt-8 space-y-5 sm:space-y-8">
        {/* ==================================================== */}
        {/* 1. نوع الإعلان (Announcement Type) */}
        {/* ==================================================== */}
        <div>
          <label className="text-sm font-bold text-brand-200 block mb-2 font-cairo">
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
                aria-pressed={formData.type === t}
                className={`min-h-12 py-3 px-2.5 rounded-xl border text-xs sm:text-[13px] leading-snug font-bold font-tajawal transition-all text-center flex flex-col items-center justify-center gap-1.5 active:scale-[0.97] ${
                  formData.type === t
                    ? 'border-brand-400 bg-brand-950/50 text-brand-200 shadow-md ring-1 ring-brand-400/50'
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
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/30 border border-slate-800">
          <label className="text-sm font-bold text-brand-200 flex items-center gap-2 mb-3 font-cairo">
            <User className="w-4 h-4 text-brand-400" />
            2. اختيار الشيخ أو الداعية: <span className="text-red-400">*</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <select
                value={formData.manualSheikh ? 'manual' : formData.primarySheikhId || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    primarySheikhId: value && value !== 'manual' ? Number(value) : null,
                    manualSheikh: value === 'manual' ? { title: 'فضيلة الشيخ', name: '', role: '' } : undefined,
                    sheikhPhotoUrl: undefined,
                  }));
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-400 font-cairo"
              >
                <option value="">-- اختر الشيخ من القائمة المعتمدة --</option>
                {sheikhs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} {s.full_name} ({s.short_name})
                  </option>
                ))}
                <option value="manual">✎ شيخ غير موجود في القائمة (إدخال يدوي)</option>
              </select>
            </div>

            {/* Sheikh Info Preview Card */}
            {primarySheikh && (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/80 border border-brand-500/20">
                <div className="w-14 h-14 rounded-full bg-brand-500/20 border border-brand-400/40 overflow-hidden shrink-0 flex items-center justify-center">
                  {selectedSheikhPhoto ? (
                    <img
                      src={selectedSheikhPhoto}
                      alt={primarySheikh.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-brand-400" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-brand-300 font-cairo truncate">
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

          {/* Sheikh typed in by hand (not in the approved list) */}
          {formData.manualSheikh && (
            <div className="mt-4 p-3 sm:p-4 rounded-xl bg-slate-900/60 border border-dashed border-brand-500/40 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">اللقب:</label>
                  <input
                    type="text"
                    value={formData.manualSheikh.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, manualSheikh: { ...prev.manualSheikh!, title: e.target.value } }))
                    }
                    placeholder="فضيلة الشيخ"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 block mb-1">
                    اسم الشيخ: <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.manualSheikh.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, manualSheikh: { ...prev.manualSheikh!, name: e.target.value } }))
                    }
                    placeholder="مثال: د. عبد الله محمد أحمد"
                    autoFocus
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">الصفة أو المنصب (اختياري):</label>
                <input
                  type="text"
                  value={formData.manualSheikh.role}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, manualSheikh: { ...prev.manualSheikh!, role: e.target.value } }))
                  }
                  placeholder="مثال: إمام وخطيب مسجد الفتح"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-400"
                />
              </div>
              {isAdminLoggedIn ? (
                <button
                  type="button"
                  onClick={handleSaveManualSheikh}
                  disabled={savingSheikh || !formData.manualSheikh.name.trim()}
                  className="min-h-10 px-4 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 text-brand-300 text-xs font-bold border border-brand-500/30 inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {savingSheikh ? 'جاري الحفظ...' : 'حفظ الشيخ في القائمة المعتمدة'}
                </button>
              ) : (
                <p className="text-[11px] text-slate-500">
                  يُستخدم هذا الاسم في هذا الإعلان فقط. لإضافته للقائمة المعتمدة مع صورته، تواصل مع الإدارة.
                </p>
              )}
            </div>
          )}

          {/* Photo picker when the sheikh has several photos */}
          {sheikhPhotos.length > 1 && (
            <div className="mt-4">
              <span className="text-xs font-medium text-slate-300 block mb-2">
                اختر صورة الشيخ التي تظهر في الإعلان:
              </span>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 snap-x">
                {sheikhPhotos.map((url, i) => {
                  const active = url === selectedSheikhPhoto;
                  return (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, sheikhPhotoUrl: url }))}
                      aria-pressed={active}
                      aria-label={`صورة رقم ${i + 1}`}
                      className={`relative shrink-0 snap-start w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                        active
                          ? 'border-brand-400 ring-2 ring-brand-400/40 scale-[1.03]'
                          : 'border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {active && (
                        <span className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-brand-500 text-on-brand flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                className="w-full sm:w-auto bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-brand-400"
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
                    className="inline-flex items-center gap-1 ps-3 pe-1 py-1 rounded-full text-xs bg-slate-900 border border-brand-500/30 text-brand-200"
                  >
                    <span>{s.title} {s.short_name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSecondarySheikh(id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-base text-slate-400 hover:text-red-400 hover:bg-slate-800"
                      aria-label={`إزالة ${s.short_name}`}
                    >
                      ×
                    </button>
                  </span>
                );
              })}

              {(formData.manualCoSheikhs || []).map((name) => (
                <span
                  key={`manual-${name}`}
                  className="inline-flex items-center gap-1 ps-3 pe-1 py-1 rounded-full text-xs bg-slate-900 border border-dashed border-brand-500/40 text-brand-200"
                >
                  <span>{name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        manualCoSheikhs: (prev.manualCoSheikhs || []).filter((n) => n !== name),
                      }))
                    }
                    className="w-7 h-7 rounded-full flex items-center justify-center text-base text-slate-400 hover:text-red-400 hover:bg-slate-800"
                    aria-label={`إزالة ${name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Participant typed in by hand */}
            <form
              className="mt-2.5 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const name = manualCoSheikh.trim();
                if (!name) return;
                setFormData((prev) => ({
                  ...prev,
                  manualCoSheikhs: [...(prev.manualCoSheikhs || []).filter((n) => n !== name), name],
                }));
                setManualCoSheikh('');
              }}
            >
              <input
                type="text"
                value={manualCoSheikh}
                onChange={(e) => setManualCoSheikh(e.target.value)}
                placeholder="أو اكتب اسم مشارك غير موجود بالقائمة..."
                className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-400"
              />
              <button
                type="submit"
                disabled={!manualCoSheikh.trim()}
                className="shrink-0 min-h-10 px-4 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 text-brand-300 text-xs font-bold border border-brand-500/30 inline-flex items-center gap-1 disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة
              </button>
            </form>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 3 & 4. الموقع الجغرافي والمسجد (Location & Mosque) */}
        {/* ==================================================== */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-4">
          <label className="text-sm font-bold text-brand-200 flex items-center gap-2 font-cairo">
            <MapPin className="w-4 h-4 text-brand-400" />
            3. الموقع الجغرافي والمسجد: <span className="text-red-400">*</span>
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-400"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-400 disabled:opacity-40"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-400 disabled:opacity-40"
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
            <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-950/40 border border-brand-500/30 text-brand-300 text-xs font-tajawal">
              <Info className="w-4 h-4 shrink-0 text-brand-400" />
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-400"
              />
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* 5. التاريخ واليوم (Mandatory Friday Check) */}
        {/* ==================================================== */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-4">
          <label className="text-sm font-bold text-brand-200 flex items-center gap-2 font-cairo">
            <Calendar className="w-4 h-4 text-brand-400" />
            4. التاريخ واليوم: <span className="text-red-400">*</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Date Input */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">
                {formData.type === 'خطبة جمعة' ? 'اختر الجمعة:' : 'تاريخ الفعالية:'}
              </label>
              {formData.type === 'خطبة جمعة' ? (
                // Native date pickers can't restrict weekdays, so offer Fridays only
                <select
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full min-h-11 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-400"
                >
                  {fridayOptions.map((d) => (
                    <option key={d} value={d}>
                      الجمعة {formatGregorianArabic(d)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-400"
                />
              )}
            </div>

            {/* Auto Computed Day Name */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">اليوم (تلقائي):</label>
              <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-brand-300 font-cairo flex items-center justify-between">
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
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-4">
          <label className="text-sm font-bold text-brand-200 flex items-center gap-2 font-cairo">
            <Clock className="w-4 h-4 text-brand-400" />
            5. التوقيت والموعد:
          </label>

          <div
            className={`grid gap-2 ${
              isFridaySermon ? 'grid-cols-2 sm:max-w-md' : 'grid-cols-2 sm:grid-cols-4 md:grid-cols-7'
            }`}
          >
            {timeOptions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, timeType: t }))}
                aria-pressed={formData.timeType === t}
                className={`min-h-11 py-2 px-2 rounded-xl border text-xs font-bold font-tajawal text-center transition-colors active:scale-[0.97] ${
                  formData.timeType === t
                    ? 'border-brand-400 bg-brand-950/40 text-brand-200'
                    : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Conditional Hour and Minute for "وقت محدد" */}
          {formData.timeType === 'وقت محدد' && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2">
              <span className="w-full sm:w-auto text-xs text-slate-400">حدد الساعة والدقيقة:</span>
              <select
                value={formData.customTimeHour || '08'}
                onChange={(e) => setFormData((prev) => ({ ...prev, customTimeHour: e.target.value }))}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
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
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
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
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
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
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-4">
          <label className="text-sm font-bold text-brand-200 flex items-center gap-2 font-cairo">
            <BookOpen className="w-4 h-4 text-brand-400" />
            {isFridaySermon ? (
              '6. تفاصيل إضافية:'
            ) : (
              <>
                6. تفاصيل وموضوع الإعلان: <span className="text-red-400">*</span>
              </>
            )}
          </label>

          <div className="space-y-4">
            {/* Main Title (a Friday sermon has no announced title) */}
            {!isFridaySermon && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {formData.type === 'دورة علمية' ? 'اسم الدورة العلمية:' : 'عنوان الإعلان أو المحاضرة:'}
                </label>
                <input
                  type="text"
                  placeholder="مثال: شرح كتاب التوحيد الذي هو حق الله على العبيد"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-400 font-cairo"
                />
              </div>
            )}

            {/* Course Books and Texts (for courses & text programs) */}
            {(formData.type === 'دورة علمية' || formData.type === 'برنامج دراسة المتون العلمية') && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  المتون أو الكتب المقررة: <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: الأصول الثلاثة، الأربعين النووية، العقيدة الواسطية"
                  value={formData.booksAndTexts || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, booksAndTexts: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-400"
                />
              </div>
            )}

            {/* Symposium themes or notes */}
            {formData.type === 'ندوة علمية' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  محاور الندوة العلمية: <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: المحور الأول: فضل العلم، المحور الثاني: شبهات والرد عليها"
                  value={formData.symposiumThemes || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, symposiumThemes: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-400"
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-400"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-x-6 sm:gap-y-2 md:pt-5">
                <label className="inline-flex items-center gap-2.5 py-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.liveBroadcast || false}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, liveBroadcast: e.target.checked }))
                    }
                    className="shrink-0 rounded bg-slate-900 border-slate-700"
                  />
                  <span>يوجد بث مباشر عبر وسائل التواصل</span>
                </label>

                <label className="inline-flex items-center gap-2.5 py-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.womenHallAvailable ?? true}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, womenHallAvailable: e.target.checked }))
                    }
                    className="shrink-0 rounded bg-slate-900 border-slate-700"
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
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-sm font-bold text-brand-200 block font-cairo">
                  7. جدول مواعيد الجلسات والبرنامج:
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  أضف مواعيد الأيام أو المحاضرات المندرجة تحت هذا البرنامج
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSession}
                className="min-h-10 py-2 px-4 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 text-xs font-bold border border-brand-500/30 flex items-center justify-center gap-1.5 self-stretch sm:self-auto"
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
                    className="grid grid-cols-2 md:grid-cols-12 gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-700 items-center text-xs"
                  >
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="اليوم (السبت)"
                        value={session.day}
                        onChange={(e) => handleUpdateSession(session.id, 'day', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <input
                        type="date"
                        value={session.date}
                        onChange={(e) => handleUpdateSession(session.id, 'date', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <input
                        type="text"
                        placeholder="الوقت (بعد صلاة المغرب)"
                        value={session.time}
                        onChange={(e) => handleUpdateSession(session.id, 'time', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-3">
                      <input
                        type="text"
                        placeholder="الشيخ أو الموضوع"
                        value={session.sheikhName || ''}
                        onChange={(e) => handleUpdateSession(session.id, 'sheikhName', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1 text-left">
                      <button
                        type="button"
                        onClick={() => handleRemoveSession(session.id)}
                        className="w-full md:w-auto min-h-10 p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 border border-slate-800 md:border-0 transition-colors inline-flex items-center justify-center gap-1.5"
                        aria-label="حذف الموعد"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="md:hidden">حذف الموعد</span>
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
        <div className="sticky bottom-0 z-10 -mx-4 px-4 pt-3 pb-safe bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent sm:static sm:mx-0 sm:px-0 sm:pt-4 sm:pb-0 sm:bg-none">
          <button
            type="button"
            onClick={onGenerateDesign}
            disabled={!canSubmit}
            className="w-full py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl bg-gradient-to-l from-brand-700 to-brand-500 hover:from-brand-600 hover:to-brand-400 text-on-brand font-black text-base sm:text-lg shadow-2xl shadow-brand-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            إنشاء التصميم الآن ومعاينته
          </button>
          {!canSubmit && (
            <p className="text-center text-xs text-slate-400 mt-2 font-tajawal">
              أكمل قبل إنشاء التصميم: <span className="font-bold text-red-400">{missingFields.join('، ')}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
