/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { AnnouncementForm } from './components/AnnouncementForm';
import { PreviewModal } from './components/PreviewModal';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AdminLogin } from './components/Admin/AdminLogin';
import { SiteGate } from './components/SiteGate';
import {
  AnnouncementFormData,
  Sheikh,
  Mosque,
  State,
  Locality,
  VisualIdentity,
  DesignTemplate,
} from './types';
import { api } from './services/api';
import { getArabicDayName, getNextFridayISO, toHijriDate, toLocalISODate } from './utils/hijri';
import { recommendTemplate } from './utils/templates';
import { resolvePrimarySheikh, resolveSecondarySheikhs } from './utils/sheikh';
import {
  ArrowDown,
  Globe,
  Youtube,
  Facebook,
  MessageCircle,
  Send,
  Instagram,
  Twitter,
} from 'lucide-react';
import { BrandEmblem, BrandWordmark } from './components/Brand';

// Official accounts, as printed on the group's identity strip
const SOCIAL_LINKS = [
  { label: 'الموقع الرسمي', href: 'https://www.ansar-alsuna.net', icon: Globe },
  { label: 'يوتيوب', href: 'https://www.youtube.com/@alsuna1431', icon: Youtube },
  { label: 'فيسبوك', href: 'https://www.facebook.com/AnsarAlsuna.sd', icon: Facebook },
  { label: 'واتساب', href: 'https://wa.me/249128488888', icon: MessageCircle },
  { label: 'تيليجرام', href: 'https://t.me/AnsarAlsuna', icon: Send },
  { label: 'إنستغرام', href: 'https://www.instagram.com/AnsarAlsuna', icon: Instagram },
  { label: 'إكس (تويتر)', href: 'https://x.com/AnsarAlsuna', icon: Twitter },
];

export default function App() {
  // Application Data States
  const [sheikhs, setSheikhs] = useState<Sheikh[]>([]);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [identity, setIdentity] = useState<VisualIdentity>({
    dawah_header_text: 'جماعة أنصار السنة المحمدية بالسودان',
    dawah_header_subtext: 'الأمانة العامة للدعوة والتعليم - إدارة البرامج العلمية',
    website_url: 'https://design.ansaralsuna.net',
    facebook_handle: 'ansaralsunasudan',
    youtube_handle: 'ansaralsunasudan',
    telegram_handle: 'ansaralsunasudan',
    contact_phone: '+249 912345678',
  });

  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState<AnnouncementFormData>(() => {
    const dateStr = getNextFridayISO();

    return {
      type: 'خطبة جمعة',
      title: '',
      subtitle: '',
      primarySheikhId: 1,
      secondarySheikhIds: [],
      stateId: 1,
      localityId: 1,
      mosqueId: 1,
      customLocation: '',
      date: dateStr,
      dayName: 'الجمعة',
      hijriDate: toHijriDate(dateStr),
      timeType: 'وقت صلاة الجمعة',
      customTimeHour: '08',
      customTimeMinute: '00',
      customTimePeriod: 'م',
      specialNotes: 'الدعوة عامة للجميع',
      liveBroadcast: true,
      womenHallAvailable: true,
      multiSessions: [],
      templateId: '',
    };
  });

  // UI Modals State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const formSectionRef = useRef<HTMLDivElement>(null);

  // Site password gate: nothing loads until the visitor has entered it
  const [siteAccess, setSiteAccess] = useState<'checking' | 'locked' | 'open'>('checking');
  useEffect(() => {
    api
      .getSiteStatus()
      .then((r) => setSiteAccess(r.unlocked ? 'open' : 'locked'))
      .catch(() => setSiteAccess('open'));
  }, []);

  // Initial load
  useEffect(() => {
    if (siteAccess !== 'open') return;
    async function loadData() {
      try {
        const [
          sheikhsData,
          mosquesData,
          statesData,
          localitiesData,
          templatesData,
          identityData,
        ] = await Promise.all([
          api.getSheikhs(),
          api.getMosques(),
          api.getStates(),
          api.getLocalities(),
          api.getTemplates(),
          api.getVisualIdentity(),
        ]);

        setSheikhs(sheikhsData);
        setMosques(mosquesData);
        setStates(statesData);
        setLocalities(localitiesData);
        setTemplates(templatesData);
        setIdentity(identityData);

        // Pre-select first sheikh and mosque if present
        if (sheikhsData.length > 0) {
          setFormData((prev) => ({
            ...prev,
            primarySheikhId: prev.primarySheikhId || sheikhsData[0].id,
            stateId: prev.stateId || statesData[0]?.id || 1,
            localityId: prev.localityId || localitiesData[0]?.id || 1,
            mosqueId: prev.mosqueId || mosquesData[0]?.id || 1,
          }));
        }

        // Start from the archive style that matches the default announcement type, if any
        setFormData((prev) => ({ ...prev, templateId: recommendTemplate(prev.type, templatesData) }));
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    }

    // Check if admin is currently authenticated
    api
      .getMe()
      .then(() => setIsAdminLoggedIn(true))
      .catch(() => setIsAdminLoggedIn(false));

    loadData();
  }, [siteAccess]);

  const handleOpenAdmin = () => {
    if (isAdminLoggedIn) {
      setIsAdminDashboardOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setIsAdminLoginOpen(false);
    setIsAdminDashboardOpen(true);
  };

  const handleAdminLogout = () => {
    api.logout();
    setIsAdminLoggedIn(false);
    setIsAdminDashboardOpen(false);
  };

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResetForm = () => {
    const dateStr = getNextFridayISO();

    setFormData({
      type: 'خطبة جمعة',
      title: '',
      subtitle: '',
      primarySheikhId: sheikhs[0]?.id || 1,
      secondarySheikhIds: [],
      stateId: states[0]?.id || 1,
      localityId: localities[0]?.id || 1,
      mosqueId: mosques[0]?.id || 1,
      customLocation: '',
      date: dateStr,
      dayName: 'الجمعة',
      hijriDate: toHijriDate(dateStr),
      timeType: 'وقت صلاة الجمعة',
      specialNotes: 'الدعوة عامة',
      liveBroadcast: false,
      womenHallAvailable: true,
      multiSessions: [],
      templateId: recommendTemplate('خطبة جمعة', templates),
    });
  };

  const handleEditAnnouncementInMainForm = (announcement: any) => {
    setFormData({
      type: announcement.type || 'محاضرة عامة',
      title: announcement.title || '',
      subtitle: announcement.subtitle || '',
      primarySheikhId: announcement.primarySheikhId || sheikhs[0]?.id || 1,
      sheikhPhotoUrl: announcement.sheikhPhotoUrl,
      manualSheikh: announcement.manualSheikh,
      manualCoSheikhs: announcement.manualCoSheikhs || [],
      secondarySheikhIds: announcement.secondarySheikhIds || [],
      stateId: announcement.stateId || states[0]?.id || 1,
      localityId: announcement.localityId || localities[0]?.id || 1,
      mosqueId: announcement.mosqueId || mosques[0]?.id || 1,
      customLocation: announcement.customLocation || '',
      date: announcement.date || toLocalISODate(new Date()),
      dayName: announcement.dayName || getArabicDayName(announcement.date),
      hijriDate: toHijriDate(announcement.date),
      timeType:
        announcement.type === 'خطبة جمعة' && announcement.timeType !== 'وقت محدد'
          ? 'وقت صلاة الجمعة'
          : announcement.timeType || 'بعد صلاة المغرب',
      specialNotes: announcement.specialNotes || '',
      liveBroadcast: announcement.liveBroadcast || false,
      womenHallAvailable: announcement.womenHallAvailable ?? true,
      multiSessions: announcement.multiSessions || [],
      templateId: recommendTemplate(announcement.type || 'محاضرة عامة', templates),
    });
    setIsAdminDashboardOpen(false);
    setTimeout(() => scrollToForm(), 200);
  };

  const primarySheikhObj = resolvePrimarySheikh(formData, sheikhs);
  const secondarySheikhsObjs = resolveSecondarySheikhs(formData, sheikhs);
  const mosqueObj = mosques.find((m) => m.id === formData.mosqueId);
  const stateObj = states.find((s) => s.id === formData.stateId);
  const localityObj = localities.find((l) => l.id === formData.localityId);

  // If in Admin Dashboard mode
  if (siteAccess === 'checking') {
    return <div className="min-h-screen bg-slate-950" />;
  }
  if (siteAccess === 'locked') {
    return <SiteGate onUnlocked={() => setSiteAccess('open')} />;
  }

  if (isAdminDashboardOpen && isAdminLoggedIn) {
    return (
      <AdminDashboard
        onLogout={handleAdminLogout}
        sheikhs={sheikhs}
        setSheikhs={setSheikhs}
        mosques={mosques}
        setMosques={setMosques}
        states={states}
        setStates={setStates}
        localities={localities}
        setLocalities={setLocalities}
        identity={identity}
        setIdentity={setIdentity}
        templates={templates}
        setTemplates={setTemplates}
        onEditAnnouncementInMainForm={handleEditAnnouncementInMainForm}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500/30 selection:text-brand-200">
      {/* Top Navbar */}
      <Navbar
        identity={identity}
        onOpenAdmin={handleOpenAdmin}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Hero Section: branded navy band with Islamic geometry */}
      <section className="theme-reset relative overflow-hidden bg-gradient-to-b from-brand-900 via-brand-950 to-[#0b1630] text-white">
        <div className="absolute inset-0 bg-islamic-geo opacity-[0.06] pointer-events-none" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[520px] rounded-full bg-brand-500/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-brand-400/10 blur-3xl pointer-events-none" />
        <img
          src="/brand/emblem.png"
          alt=""
          aria-hidden="true"
          className="hidden md:block absolute -left-28 top-1/2 -translate-y-1/2 w-[460px] opacity-[0.07] grayscale brightness-200 pointer-events-none select-none"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-10 pb-20 sm:pt-14 sm:pb-28 md:pt-16 md:pb-32 text-center">
          <div className="flex justify-center">
            <BrandWordmark className="h-24 sm:h-32 md:h-36 brightness-0 invert drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]" />
          </div>

          {/* Ornamental divider */}
          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-3 text-brand-300" aria-hidden="true">
            <span className="h-px w-16 sm:w-24 bg-gradient-to-l from-brand-300/70 to-transparent" />
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M12 1l2.6 6.3L21 9l-5 4.3L17.4 21 12 17.3 6.6 21 8 13.3 3 9l6.4-1.7z" />
            </svg>
            <span className="h-px w-16 sm:w-24 bg-gradient-to-r from-brand-300/70 to-transparent" />
          </div>

          <h1 className="mt-5 sm:mt-6 text-3xl sm:text-4xl md:text-5xl font-extrabold text-white font-display leading-tight">
            المصمم الذكي
          </h1>

          <p className="mt-4 text-sm sm:text-base md:text-lg text-brand-100/80 max-w-2xl mx-auto font-tajawal leading-relaxed">
            أنشئ إعلانات خطب الجمعة والمحاضرات والدورات العلمية بالهوية الرسمية للجماعة، جاهزة للنشر في أقل من دقيقتين.
          </p>

          <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToForm}
              className="w-full sm:w-auto py-3.5 sm:py-4 px-9 rounded-2xl bg-white hover:bg-brand-50 text-brand-800 font-bold text-base shadow-xl shadow-black/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
            >
              <span>إنشاء إعلان جديد</span>
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Soft arch into the light page */}
        <svg
          className="absolute bottom-0 inset-x-0 w-full h-10 sm:h-16 md:h-20"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 80V40C240 8 480 0 720 0s480 8 720 40v40Z" fill="#f1f5f9" />
        </svg>
      </section>

      {/* Main Creation Form Section */}
      <main ref={formSectionRef} className="flex-1 py-6 sm:py-10 md:py-14 px-3 sm:px-4 max-w-7xl mx-auto w-full scroll-mt-16 sm:scroll-mt-20">
        <AnnouncementForm
          formData={formData}
          setFormData={setFormData}
          sheikhs={sheikhs}
          states={states}
          localities={localities}
          mosques={mosques}
          templates={templates}
          isAdminLoggedIn={isAdminLoggedIn}
          onSheikhsChanged={setSheikhs}
          onGenerateDesign={() => setIsPreviewOpen(true)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 pt-8 sm:pt-10 px-4 pb-safe">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-5 text-center">
          <div className="flex items-center gap-3">
            <BrandEmblem customUrl={identity.group_logo_url} className="h-14 w-14" />
            <div className="text-right">
              <div className="text-sm font-bold text-slate-100 font-display">
                جماعة أنصار السنة المحمدية بالسودان
              </div>
              <div className="text-xs text-brand-300 font-tajawal font-medium">أمانة الدعوة</div>
            </div>
          </div>

          <nav aria-label="حسابات الجماعة" className="flex flex-wrap items-center justify-center gap-2">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                title={label}
                aria-label={label}
                className="w-10 h-10 rounded-full border border-slate-700 text-slate-400 hover:text-brand-400 hover:border-brand-500/50 hover:bg-brand-500/10 flex items-center justify-center transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </nav>

          <div dir="ltr" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400 font-tajawal">
            <a href="https://www.ansar-alsuna.net" target="_blank" rel="noreferrer" className="hover:text-brand-400">
              www.ansar-alsuna.net
            </a>
            <span className="text-slate-600">•</span>
            <a href="https://wa.me/249128488888" target="_blank" rel="noreferrer" className="hover:text-brand-400">
              +249 128 488 888
            </a>
            <span className="text-slate-600">•</span>
            <span>@AnsarAlsuna</span>
          </div>

          <div className="w-full border-t border-slate-800 py-4 text-[11px] sm:text-xs text-slate-500 font-tajawal">
            جميع الحقوق محفوظة © {new Date().getFullYear()} جماعة أنصار السنة المحمدية بالسودان – أمانة الدعوة
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onReset={handleResetForm}
        formData={formData}
        setFormData={setFormData}
        primarySheikh={primarySheikhObj}
        secondarySheikhs={secondarySheikhsObjs}
        mosque={mosqueObj}
        state={stateObj}
        locality={localityObj}
        identity={identity}
        templates={templates}
      />

      <AdminLogin
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
