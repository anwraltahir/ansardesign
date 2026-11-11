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
import { getArabicDayName, toHijriDate } from './utils/hijri';
import { Sparkles, ArrowDown, Shield, CheckCircle, ExternalLink } from 'lucide-react';

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
    // Find next Friday
    const d = new Date();
    const day = d.getDay();
    const diff = (5 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    const dateStr = d.toISOString().slice(0, 10);

    return {
      type: 'خطبة جمعة',
      title: 'وجوب الاعتصام بالكتاب والسنة والتحذير من الفرقة',
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
      timeType: 'بعد صلاة الجمعة',
      customTimeHour: '08',
      customTimeMinute: '00',
      customTimePeriod: 'م',
      specialNotes: 'الدعوة عامة للجميع',
      liveBroadcast: true,
      womenHallAvailable: true,
      multiSessions: [],
      templateId: 'emerald-turquoise',
    };
  });

  // UI Modals State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const formSectionRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
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
  }, []);

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
    const d = new Date();
    const day = d.getDay();
    const diff = (5 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    const dateStr = d.toISOString().slice(0, 10);

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
      timeType: 'بعد صلاة الجمعة',
      specialNotes: 'الدعوة عامة',
      liveBroadcast: false,
      womenHallAvailable: true,
      multiSessions: [],
      templateId: 'golden-heritage',
    });
  };

  const handleEditAnnouncementInMainForm = (announcement: any) => {
    setFormData({
      type: announcement.type || 'محاضرة عامة',
      title: announcement.title || '',
      subtitle: announcement.subtitle || '',
      primarySheikhId: announcement.primarySheikhId || sheikhs[0]?.id || 1,
      secondarySheikhIds: announcement.secondarySheikhIds || [],
      stateId: announcement.stateId || states[0]?.id || 1,
      localityId: announcement.localityId || localities[0]?.id || 1,
      mosqueId: announcement.mosqueId || mosques[0]?.id || 1,
      customLocation: announcement.customLocation || '',
      date: announcement.date || new Date().toISOString().slice(0, 10),
      dayName: announcement.dayName || getArabicDayName(announcement.date),
      hijriDate: toHijriDate(announcement.date),
      timeType: announcement.timeType || 'بعد صلاة المغرب',
      specialNotes: announcement.specialNotes || '',
      liveBroadcast: announcement.liveBroadcast || false,
      womenHallAvailable: announcement.womenHallAvailable ?? true,
      multiSessions: announcement.multiSessions || [],
      templateId: announcement.templateId || 'golden-heritage',
    });
    setIsAdminDashboardOpen(false);
    setTimeout(() => scrollToForm(), 200);
  };

  const primarySheikhObj = sheikhs.find((s) => s.id === formData.primarySheikhId);
  const secondarySheikhsObjs = sheikhs.filter((s) =>
    formData.secondarySheikhIds.includes(s.id)
  );
  const mosqueObj = mosques.find((m) => m.id === formData.mosqueId);
  const stateObj = states.find((s) => s.id === formData.stateId);
  const localityObj = localities.find((l) => l.id === formData.localityId);

  // If in Admin Dashboard mode
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navbar */}
      <Navbar
        identity={identity}
        onOpenAdmin={handleOpenAdmin}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 border-b border-slate-900 bg-gradient-to-b from-slate-900/50 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-islamic-pattern opacity-60 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 text-center z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold font-cairo">
            <Sparkles className="w-3.5 h-3.5" />
            منصة إنشاء إعلانات أمانة الدعوة
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white font-cairo tracking-tight">
            المصمم الذكي
          </h1>

          <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto font-tajawal leading-relaxed">
            أنشئ إعلانات خطب الجمعة، المحاضرات الكبرى، والدورات العلمية الخاصة بجماعة أنصار السنة المحمدية بالسودان بدقة واحترافية وبأقل من دقيقتين.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToForm}
              className="py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/20 flex items-center gap-2.5 cursor-pointer transition-all active:scale-[0.98]"
            >
              <span>إنشاء إعلان جديد</span>
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Creation Form Section */}
      <main ref={formSectionRef} className="flex-1 py-12 md:py-16 px-4 max-w-7xl mx-auto w-full">
        <AnnouncementForm
          formData={formData}
          setFormData={setFormData}
          sheikhs={sheikhs}
          states={states}
          localities={localities}
          mosques={mosques}
          onGenerateDesign={() => setIsPreviewOpen(true)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-8 px-4 text-center text-xs text-slate-500 font-tajawal">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} جماعة أنصار السنة المحمدية بالسودان – أمانة الدعوة
          </div>
          <div className="flex items-center gap-3 dir-ltr text-slate-400">
            <span>design.ansaralsuna.net</span>
            <span>•</span>
            <a
              href="https://ansaralsuna.net"
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <span>ansaralsuna.net</span>
              <ExternalLink className="w-3 h-3" />
            </a>
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
