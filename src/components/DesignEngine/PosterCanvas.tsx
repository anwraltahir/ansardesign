import React, { forwardRef } from 'react';
import {
  AnnouncementFormData,
  Sheikh,
  Mosque,
  State,
  Locality,
  VisualIdentity,
} from '../../types';
import {
  BismillahSvg,
  AnsarLogoSvg,
  CornerOrnament,
  IslamicStar,
  MosqueSkyline,
} from './IslamicDecorations';
import { formatGregorianArabic, toHijriDate } from '../../utils/hijri';
import { Calendar, Clock, MapPin, Radio, Users, BookOpen } from 'lucide-react';

interface PosterCanvasProps {
  formData: AnnouncementFormData;
  primarySheikh?: Sheikh | null;
  secondarySheikhs?: Sheikh[];
  mosque?: Mosque | null;
  state?: State | null;
  locality?: Locality | null;
  identity?: VisualIdentity | null;
  aspectRatio?: '4:5' | '1:1' | '9:16' | 'print';
}

export const PosterCanvas = forwardRef<HTMLDivElement, PosterCanvasProps>(
  (
    {
      formData,
      primarySheikh,
      secondarySheikhs = [],
      mosque,
      state,
      locality,
      identity,
      aspectRatio = '4:5',
    },
    ref
  ) => {
    const templateId = formData.templateId || 'golden-heritage';
    const gregorianFormatted = formatGregorianArabic(formData.date);
    const hijriFormatted = formData.hijriDate || toHijriDate(formData.date);

    // Dynamic dimensions based on aspect ratio
    // Default 1080x1350 (4:5)
    let containerStyle: React.CSSProperties = {
      width: '1080px',
      height: '1350px',
    };

    if (aspectRatio === '1:1') {
      containerStyle = { width: '1080px', height: '1080px' };
    } else if (aspectRatio === '9:16') {
      containerStyle = { width: '1080px', height: '1920px' };
    } else if (aspectRatio === 'print') {
      containerStyle = { width: '1200px', height: '1500px' };
    }

    // Time display string
    let timeDisplay: string = formData.timeType;
    if (formData.timeType === 'وقت محدد') {
      const h = formData.customTimeHour || '08';
      const m = formData.customTimeMinute || '00';
      const p = formData.customTimePeriod || 'م';
      timeDisplay = `الساعة ${h}:${m} ${p === 'ص' ? 'صباحاً' : 'مساءً'}`;
    }

    // Location display string
    const locationParts = [
      mosque ? mosque.name : formData.customLocation || 'مسجد أنصار السنة',
      mosque?.area_neighborhood,
      locality?.name,
      state?.name,
    ].filter(Boolean);

    // Template specific styling rules
    const getTemplateTheme = () => {
      switch (templateId) {
        case 'official-blue':
          return {
            bg: 'bg-gradient-to-b from-[#071329] via-[#0c224b] to-[#050e1f]',
            border: 'border-sky-400/40',
            accent: 'text-sky-300',
            badgeBg: 'bg-sky-950/80 border-sky-400/50 text-sky-200',
            cardBg: 'bg-slate-900/70 border-sky-500/20',
            goldText: 'text-amber-300',
            divider: 'border-sky-400/30',
          };
        case 'emerald-turquoise':
          return {
            bg: 'bg-gradient-to-b from-[#022c22] via-[#064e3b] to-[#011a14]',
            border: 'border-emerald-400/50',
            accent: 'text-emerald-300',
            badgeBg: 'bg-emerald-950/90 border-emerald-400/60 text-emerald-200',
            cardBg: 'bg-emerald-950/60 border-emerald-500/30',
            goldText: 'text-amber-300',
            divider: 'border-emerald-400/30',
          };
        case 'mosque-architecture':
          return {
            bg: 'bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#090d16]',
            border: 'border-amber-400/40',
            accent: 'text-amber-300',
            badgeBg: 'bg-amber-950/80 border-amber-500/50 text-amber-200',
            cardBg: 'bg-slate-900/80 border-amber-500/20',
            goldText: 'text-amber-400',
            divider: 'border-amber-500/30',
          };
        case 'classic-islamic':
          return {
            bg: 'bg-gradient-to-b from-[#1c130b] via-[#2d1e11] to-[#120b06]',
            border: 'border-amber-500/60',
            accent: 'text-amber-300',
            badgeBg: 'bg-amber-950/90 border-amber-600/70 text-amber-100',
            cardBg: 'bg-amber-950/40 border-amber-600/30',
            goldText: 'text-amber-400',
            divider: 'border-amber-600/40',
          };
        case 'sheikh-portrait':
          return {
            bg: 'bg-gradient-to-b from-[#080d1a] via-[#0f172a] to-[#04070d]',
            border: 'border-amber-400/50',
            accent: 'text-amber-300',
            badgeBg: 'bg-slate-900/90 border-amber-400/50 text-amber-200',
            cardBg: 'bg-slate-900/85 border-amber-400/25',
            goldText: 'text-amber-400',
            divider: 'border-amber-400/30',
          };
        case 'minimalist-clean':
          return {
            bg: 'bg-gradient-to-b from-[#090d16] via-[#0f172a] to-[#060910]',
            border: 'border-slate-700',
            accent: 'text-slate-300',
            badgeBg: 'bg-slate-800/90 border-slate-600 text-slate-100',
            cardBg: 'bg-slate-900/50 border-slate-700/50',
            goldText: 'text-amber-300',
            divider: 'border-slate-800',
          };
        case 'modern-geometric':
          return {
            bg: 'bg-gradient-to-b from-[#0b1329] via-[#0f1f42] to-[#060a17]',
            border: 'border-teal-400/40',
            accent: 'text-teal-300',
            badgeBg: 'bg-teal-950/90 border-teal-400/50 text-teal-200',
            cardBg: 'bg-slate-900/75 border-teal-500/20',
            goldText: 'text-amber-300',
            divider: 'border-teal-400/30',
          };
        case 'golden-heritage':
        default:
          return {
            bg: 'bg-gradient-to-b from-[#081d16] via-[#0c2a20] to-[#040e0b]',
            border: 'border-amber-400/60',
            accent: 'text-amber-300',
            badgeBg: 'bg-emerald-950/90 border-amber-400/60 text-amber-200',
            cardBg: 'bg-emerald-950/60 border-amber-500/30',
            goldText: 'text-amber-300',
            divider: 'border-amber-400/40',
          };
      }
    };

    const theme = getTemplateTheme();

    return (
      <div
        ref={ref}
        id="ansar-poster-canvas"
        style={containerStyle}
        dir="rtl"
        className={`relative flex flex-col justify-between overflow-hidden text-slate-100 font-sans select-none ${theme.bg} p-12`}
      >
        {/* Ambient Geometric Islamic Background Pattern */}
        <div className="absolute inset-0 bg-islamic-stars opacity-40 pointer-events-none" />

        {/* Architectural Mosque Skyline in background */}
        <div className="absolute bottom-16 inset-x-0 opacity-15 pointer-events-none flex justify-center">
          <MosqueSkyline className="w-full h-40 text-amber-400" />
        </div>

        {/* Outer Ornamental Double Frame */}
        <div
          className={`absolute inset-6 border-2 ${theme.border} pointer-events-none z-10`}
        />
        <div
          className={`absolute inset-8 border border-dashed ${theme.border} opacity-50 pointer-events-none z-10`}
        />

        {/* Four Ornamental Corners */}
        <div className="absolute top-6 right-6 pointer-events-none z-20">
          <CornerOrnament className="w-20 h-20 text-amber-400" />
        </div>
        <div className="absolute top-6 left-6 pointer-events-none z-20 -scale-x-100">
          <CornerOrnament className="w-20 h-20 text-amber-400" />
        </div>
        <div className="absolute bottom-6 right-6 pointer-events-none z-20 -scale-y-100">
          <CornerOrnament className="w-20 h-20 text-amber-400" />
        </div>
        <div className="absolute bottom-6 left-6 pointer-events-none z-20 -scale-x-100 -scale-y-100">
          <CornerOrnament className="w-20 h-20 text-amber-400" />
        </div>

        {/* ======================================================== */}
        {/* 1. HEADER SECTION (Emblem, Bismillah, Dawah Identity) */}
        {/* ======================================================== */}
        <div className="relative z-20 flex flex-col items-center text-center pt-2">
          {/* Top Bismillah */}
          <div className="mb-2">
            <BismillahSvg className="h-10 text-amber-300 drop-shadow-md" />
          </div>

          {/* Identity Header */}
          <div className="flex items-center justify-center gap-6 w-full max-w-4xl border-b border-amber-500/25 pb-4">
            {/* Logo */}
            <div className="shrink-0 drop-shadow-lg">
              {identity?.group_logo_url ? (
                <img
                  src={identity.group_logo_url}
                  alt="شعار أنصار السنة"
                  className="h-20 w-20 object-contain"
                />
              ) : (
                <AnsarLogoSvg className="h-20 w-20" />
              )}
            </div>

            {/* Titles */}
            <div className="flex flex-col text-right">
              <span className="text-xl font-bold tracking-wide text-amber-100 font-cairo">
                {identity?.dawah_header_text || 'جماعة أنصار السنة المحمدية بالسودان'}
              </span>
              <span className="text-sm font-medium text-amber-400/90 font-cairo">
                {identity?.dawah_header_subtext ||
                  'الأمانة العامة للدعوة والتعليم - إدارة البرامج الدعوية'}
              </span>
            </div>

            {/* Live Broadcast / Women Hall Badges */}
            <div className="mr-auto flex flex-col gap-1 items-end">
              {formData.liveBroadcast && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600/90 text-white shadow-md animate-pulse">
                  <Radio className="w-3.5 h-3.5" />
                  بث مباشر
                </span>
              )}
              {formData.womenHallAvailable && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-800/80 text-emerald-200 border border-emerald-500/30">
                  <Users className="w-3.5 h-3.5" />
                  يوجد مكان مخصص للنساء
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. ANNOUNCEMENT BADGE & MAIN TITLE */}
        {/* ======================================================== */}
        <div className="relative z-20 flex flex-col items-center text-center my-auto py-2">
          {/* Announcement Type Badge */}
          <div className="mb-4">
            <div
              className={`inline-flex items-center gap-2 px-8 py-2 rounded-full border text-lg font-bold font-tajawal shadow-lg ${theme.badgeBg}`}
            >
              <IslamicStar className="w-5 h-5 text-amber-400" />
              <span>{formData.type}</span>
              <IslamicStar className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          {/* Main Title / Topic */}
          <h1 className="text-4xl md:text-5xl font-black font-cairo text-amber-100 leading-tight max-w-4xl drop-shadow-md px-4">
            {formData.title || 'عنوان الفعالية الدعوية'}
          </h1>

          {/* Subtitle / Topic details */}
          {(formData.subtitle || formData.topic || formData.courseName) && (
            <p className="mt-3 text-xl font-medium text-amber-200/90 font-tajawal max-w-3xl">
              {formData.subtitle || formData.topic || formData.courseName}
            </p>
          )}

          {/* Course Books & Texts or Symposium Themes if available */}
          {formData.booksAndTexts && (
            <div className="mt-3 inline-flex items-center gap-2 px-5 py-1.5 rounded-lg bg-black/40 border border-amber-500/30 text-amber-200 text-sm">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>المتون والكتب المقررة: {formData.booksAndTexts}</span>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 3. SHEIKH SECTION (Photo, Calligraphy, Title, Co-speakers) */}
        {/* ======================================================== */}
        <div className="relative z-20 my-auto py-2">
          <div
            className={`mx-auto max-w-4xl rounded-2xl p-6 border backdrop-blur-md shadow-2xl ${theme.cardBg} flex items-center justify-between gap-8`}
          >
            {/* Right: Sheikh Details */}
            <div className="flex-1 flex flex-col justify-center">
              <span className="text-amber-400/90 text-sm font-semibold tracking-wider mb-1 font-cairo">
                {formData.type === 'خطبة جمعة' ? 'خطيب الجمعة' : 'فضيلة المحاضر'}
              </span>

              {/* Title & Full Name */}
              <div className="text-2xl font-black text-white font-cairo drop-shadow-sm">
                {primarySheikh ? (
                  <>
                    <span className="text-amber-300 font-bold ml-1 text-xl">
                      {primarySheikh.title}
                    </span>
                    <span>{primarySheikh.full_name}</span>
                  </>
                ) : (
                  'فضيلة الشيخ الداعية'
                )}
              </div>

              {/* Official Role / Description */}
              {primarySheikh?.role_description && (
                <div className="text-sm text-slate-300 mt-1 font-tajawal">
                  {primarySheikh.role_description}
                </div>
              )}

              {/* Calligraphy Banner if available */}
              {primarySheikh?.calligraphy_url ? (
                <div className="mt-3 h-14 w-auto flex items-center">
                  <img
                    src={primarySheikh.calligraphy_url}
                    alt="مخطوطة اسم الشيخ"
                    className="max-h-full object-contain filter drop-shadow"
                  />
                </div>
              ) : null}

              {/* Secondary Sheikhs / Co-speakers if any */}
              {secondarySheikhs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-amber-500/20">
                  <span className="text-xs text-amber-300/80 font-semibold block mb-1">
                    بمشاركة:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {secondarySheikhs.map((s) => (
                      <span
                        key={s.id}
                        className="text-xs px-3 py-1 rounded bg-black/40 border border-amber-400/20 text-slate-200"
                      >
                        {s.title} {s.short_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Left: Sheikh Photo Medallion */}
            <div className="shrink-0 relative">
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-full p-1.5 border-2 border-amber-400/80 shadow-2xl bg-gradient-to-b from-amber-400/30 to-amber-700/30 flex items-center justify-center overflow-hidden">
                {primarySheikh?.photo_url ? (
                  <img
                    src={primarySheikh.photo_url}
                    alt={primarySheikh.full_name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-900 flex flex-col items-center justify-center text-amber-300/70 p-2 text-center">
                    <IslamicStar className="w-10 h-10 mb-1 text-amber-400" />
                    <span className="text-xs font-bold font-cairo">أمانة الدعوة</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. MULTI-SESSIONS TABLE (For Courses & Programs) */}
        {/* ======================================================== */}
        {formData.multiSessions && formData.multiSessions.length > 0 && (
          <div className="relative z-20 my-auto py-1">
            <div className="mx-auto max-w-4xl bg-black/50 border border-amber-500/30 rounded-xl p-4 overflow-hidden">
              <span className="text-xs font-bold text-amber-300 mb-2 block font-cairo">
                جدول ومواعيد البرنامج:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {formData.multiSessions.map((session, idx) => (
                  <div
                    key={session.id || idx}
                    className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-700"
                  >
                    <span className="font-bold text-amber-200">
                      {session.day} ({session.date})
                    </span>
                    <span className="text-slate-300">{session.time}</span>
                    {session.sheikhName && (
                      <span className="text-amber-400 font-medium">
                        {session.sheikhName}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. LOCATION, DATE & TIME CARD */}
        {/* ======================================================== */}
        <div className="relative z-20 my-auto py-2">
          <div className="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mosque & Location Box */}
            <div
              className={`rounded-xl p-4 border backdrop-blur-sm ${theme.cardBg} flex items-center gap-3 md:col-span-1`}
            >
              <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs text-amber-400/90 font-medium">المكان والموقع:</span>
                <span className="text-sm font-bold text-white truncate font-cairo">
                  {mosque ? mosque.name : formData.customLocation || 'مسجد أنصار السنة'}
                </span>
                <span className="text-xs text-slate-300 truncate">
                  {mosque?.area_neighborhood ? `${mosque.area_neighborhood} - ` : ''}
                  {locality?.name ? `${locality.name}` : ''}
                </span>
              </div>
            </div>

            {/* Date Box */}
            <div
              className={`rounded-xl p-4 border backdrop-blur-sm ${theme.cardBg} flex items-center gap-3 md:col-span-1`}
            >
              <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-amber-400/90 font-medium">اليوم والتاريخ:</span>
                <span className="text-sm font-bold text-white font-cairo">
                  يوم {formData.dayName}
                </span>
                <span className="text-xs text-slate-300">
                  {gregorianFormatted} | {hijriFormatted}
                </span>
              </div>
            </div>

            {/* Time Box */}
            <div
              className={`rounded-xl p-4 border backdrop-blur-sm ${theme.cardBg} flex items-center gap-3 md:col-span-1`}
            >
              <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-amber-400/90 font-medium">الموعد المحدد:</span>
                <span className="text-sm font-bold text-white font-cairo">
                  {timeDisplay}
                </span>
                <span className="text-xs text-amber-300/80 font-tajawal">
                  {formData.specialNotes || 'الدعوة عامة للجميع'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 6. FOOTER (Official Website & Social Contact Bar) */}
        {/* ======================================================== */}
        <div className="relative z-20 pt-4 border-t border-amber-500/25 flex items-center justify-between text-xs text-amber-200/80 font-cairo">
          {/* Official Domain */}
          <div className="flex items-center gap-2">
            <IslamicStar className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-amber-100 dir-ltr">
              design.ansaralsuna.net
            </span>
            <span>|</span>
            <span>ansaralsuna.net</span>
          </div>

          {/* Social Channels */}
          <div className="flex items-center gap-4 text-[11px] text-slate-300">
            <span>فيسبوك: /{identity?.facebook_handle || 'ansaralsunasudan'}</span>
            <span>يوتيوب: /{identity?.youtube_handle || 'ansaralsunasudan'}</span>
            <span>تليجرام: /{identity?.telegram_handle || 'ansaralsunasudan'}</span>
          </div>

          {/* Contact phone */}
          <div className="text-amber-300 font-semibold dir-ltr">
            {identity?.contact_phone || '+249 912345678'}
          </div>
        </div>
      </div>
    );
  }
);

PosterCanvas.displayName = 'PosterCanvas';
