import React, { useState, useEffect } from 'react';
import {
  Sheikh,
  Mosque,
  State,
  Locality,
  VisualIdentity,
  DesignTemplate,
  StyleReference,
} from '../../types';
import { api } from '../../services/api';
import {
  Users,
  Building2,
  Map,
  Shield,
  Layers,
  Image as ImageIcon,
  Database,
  Archive,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  LogOut,
  Save,
  Download,
  KeyRound,
  RefreshCw,
  ExternalLink,
  ImagePlus,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { getSheikhPhotos } from '../../utils/sheikh';
import { PhotoGalleryField } from './PhotoGalleryField';

const getMosquePhotos = (m?: Partial<Mosque> | null): string[] =>
  m ? ([m.main_photo_url, ...(m.additional_photos || [])].filter(Boolean) as string[]) : [];

const ANNOUNCEMENT_TYPES = [
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
];

type AdminTab = 'sheikhs' | 'mosques' | 'locations' | 'identity' | 'templates' | 'announcements' | 'system';

interface AdminDashboardProps {
  onLogout: () => void;
  sheikhs: Sheikh[];
  setSheikhs: React.Dispatch<React.SetStateAction<Sheikh[]>>;
  mosques: Mosque[];
  setMosques: React.Dispatch<React.SetStateAction<Mosque[]>>;
  states: State[];
  setStates: React.Dispatch<React.SetStateAction<State[]>>;
  localities: Locality[];
  setLocalities: React.Dispatch<React.SetStateAction<Locality[]>>;
  identity: VisualIdentity;
  setIdentity: React.Dispatch<React.SetStateAction<VisualIdentity>>;
  templates: DesignTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<DesignTemplate[]>>;
  onEditAnnouncementInMainForm?: (announcementData: any) => void;
}

export function AdminDashboard({
  onLogout,
  sheikhs,
  setSheikhs,
  mosques,
  setMosques,
  states,
  setStates,
  localities,
  setLocalities,
  identity,
  setIdentity,
  templates,
  setTemplates,
  onEditAnnouncementInMainForm,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('sheikhs');

  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [editingSheikh, setEditingSheikh] = useState<Partial<Sheikh> | null>(null);
  const [editingMosque, setEditingMosque] = useState<Partial<Mosque> | null>(null);
  const [editingState, setEditingState] = useState<Partial<State> | null>(null);
  const [editingLocality, setEditingLocality] = useState<Partial<Locality> | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // True while a sheikh/mosque photo gallery is uploading (blocks saving)
  const [photosUploading, setPhotosUploading] = useState(false);

  // Past announcements used as style references
  const [styleReferences, setStyleReferences] = useState<StyleReference[]>([]);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [referenceUploads, setReferenceUploads] = useState(0);
  const [referenceType, setReferenceType] = useState('');

  // Fetch initial admin data
  useEffect(() => {
    loadAnnouncements();
    loadSystemStatus();
    loadStyleReferences();
    api.getAiStatus().then((r) => setAiEnabled(r.enabled)).catch(() => setAiEnabled(false));
  }, []);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadAnnouncements = async () => {
    try {
      const data = await api.getAnnouncements();
      setAnnouncements(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const data = await api.getSystemStatus();
      setSystemStatus(data);
    } catch (e) {
      console.error(e);
    }
  };

  // ==========================================
  // Sheikh Management Helpers
  // ==========================================
  const handleSaveSheikh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSheikh?.full_name || !editingSheikh?.short_name) {
      showMsg('الاسم الكامل والاسم المختصر مطلوبان', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.saveSheikh(editingSheikh);
      const updatedList = await api.getSheikhs();
      setSheikhs(updatedList);
      setEditingSheikh(null);
      showMsg('تم حفظ بيانات الشيخ بنجاح');
    } catch (err: any) {
      showMsg(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSheikh = async (id: number) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الشيخ؟')) return;
    try {
      await api.deleteSheikh(id);
      setSheikhs((prev) => prev.filter((s) => s.id !== id));
      showMsg('تم حذف الشيخ بنجاح');
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  // ==========================================
  // Mosque Management Helpers
  // ==========================================
  const handleSaveMosque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMosque?.name || !editingMosque?.state_id || !editingMosque?.locality_id) {
      showMsg('يرجى تحديد اسم المسجد والولاية والمحلية', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.saveMosque(editingMosque);
      const updatedList = await api.getMosques();
      setMosques(updatedList);
      setEditingMosque(null);
      showMsg('تم حفظ بيانات المسجد بنجاح');
    } catch (err: any) {
      showMsg(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMosque = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المسجد؟')) return;
    try {
      await api.deleteMosque(id);
      setMosques((prev) => prev.filter((m) => m.id !== id));
      showMsg('تم حذف المسجد بنجاح');
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  // ==========================================
  // Locations Management Helpers
  // ==========================================
  const handleSaveState = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingState?.name) return;
    try {
      await api.saveState(editingState);
      const updated = await api.getStates();
      setStates(updated);
      setEditingState(null);
      showMsg('تم حفظ الولاية بنجاح');
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  const handleDeleteState = async (id: number) => {
    if (!confirm('حذف الولاية سيحذف أيضاً المحليات التابعة لها. هل تريد المتابعة؟')) return;
    try {
      await api.deleteState(id);
      setStates((prev) => prev.filter((s) => s.id !== id));
      setLocalities((prev) => prev.filter((l) => l.state_id !== id));
      showMsg('تم حذف الولاية بنجاح');
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  const handleSaveLocality = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocality?.name || !editingLocality?.state_id) return;
    try {
      await api.saveLocality(editingLocality);
      const updated = await api.getLocalities();
      setLocalities(updated);
      setEditingLocality(null);
      showMsg('تم حفظ المحلية بنجاح');
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  const handleDeleteLocality = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه المحلية؟')) return;
    try {
      await api.deleteLocality(id);
      setLocalities((prev) => prev.filter((l) => l.id !== id));
      showMsg('تم حذف المحلية بنجاح');
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  // ==========================================
  // Visual Identity Helpers
  // ==========================================
  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.updateVisualIdentity(identity);
      setIdentity(res.identity);
      showMsg('تم تحديث الهوية البصرية الرسمية بنجاح');
    } catch (err: any) {
      showMsg(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Image Upload helper for any entity
  const handleFileUpload = async (
    file: File,
    category: 'sheikhs' | 'mosques' | 'logos' | 'calligraphy' | 'backgrounds' | 'designs',
    onSuccess: (url: string) => void
  ) => {
    try {
      showMsg('جاري رفع الملف إلى مجلد الخادم...');
      const res = await api.uploadFile(file, category);
      onSuccess(res.url);
      showMsg('تم رفع الملف وحفظه بنجاح');
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  // ==========================================
  // Style references (old announcements) Helpers
  // ==========================================
  const loadStyleReferences = async () => {
    try {
      setStyleReferences(await api.getStyleReferences());
    } catch (e) {
      console.error(e);
    }
  };

  const analyzeReference = async (id: number) => {
    setStyleReferences((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'analyzing', error: '' } : r)));
    try {
      const { reference } = await api.analyzeStyleReference(id);
      setStyleReferences((prev) => prev.map((r) => (r.id === id ? reference : r)));
      setTemplates(await api.getTemplates());
      showMsg(`تم استخراج أسلوب «${reference.style?.name}» وإضافته للقوالب`);
    } catch (err: any) {
      setStyleReferences((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'error', error: err.message } : r)));
      showMsg(err.message, 'error');
    }
  };

  const handleReferenceUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setReferenceUploads(files.length);
    const created: StyleReference[] = [];
    for (const file of files) {
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error('الحجم أكبر من 5 ميجابايت');
        const { url } = await api.uploadFile(file, 'references');
        const reference = await api.createStyleReference({ image_url: url, announcement_type: referenceType });
        created.push(reference);
        setStyleReferences((prev) => [...prev, reference]);
      } catch (err: any) {
        showMsg(`تعذر رفع ${file.name}: ${err.message}`, 'error');
      }
      setReferenceUploads((n) => n - 1);
    }
    if (created.length > 0) showMsg(`تمت إضافة ${created.length} إعلان للأرشيف المرجعي`);
    // Analyze one at a time so each new style sees the ones extracted before it
    if (aiEnabled) {
      for (const reference of created) await analyzeReference(reference.id);
    }
  };

  const handleDeleteReference = async (id: number) => {
    if (!confirm('حذف هذا الإعلان من الأرشيف المرجعي؟ سيُحذف القالب المستخرج منه أيضاً.')) return;
    await api.deleteStyleReference(id);
    setStyleReferences((prev) => prev.filter((r) => r.id !== id));
    setTemplates((prev) => prev.filter((t) => t.source_reference_id !== id));
    showMsg('تم حذف الإعلان المرجعي');
  };

  // Password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      showMsg('تم تغيير كلمة مرور المسؤول بنجاح');
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  const tabs: { id: AdminTab; label: string; shortLabel: string; icon: typeof Users; count?: number }[] = [
    { id: 'sheikhs', label: '1. إدارة المشايخ', shortLabel: 'المشايخ', icon: Users, count: sheikhs.length },
    { id: 'mosques', label: '2. إدارة المساجد', shortLabel: 'المساجد', icon: Building2, count: mosques.length },
    { id: 'locations', label: '3. الولايات والمحليات', shortLabel: 'المواقع', icon: Map, count: states.length },
    { id: 'identity', label: '4. الهوية البصرية الرسمية', shortLabel: 'الهوية', icon: Shield },
    { id: 'templates', label: `5. قوالب التصميم (${templates.length})`, shortLabel: 'القوالب', icon: Layers },
    { id: 'announcements', label: '6. أرشيف الإعلانات المحفوظة', shortLabel: 'الأرشيف', icon: Archive, count: announcements.length },
    { id: 'system', label: '7. قاعدة البيانات والنسخ الاحتياطي', shortLabel: 'النظام', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* Top Admin Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 py-2 sm:py-4 pt-[max(0.5rem,env(safe-area-inset-top))] flex items-center justify-between gap-3 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-brand-200 font-display truncate">
              لوحة إدارة المصمم الذكي
            </h1>
            <p className="text-xs text-slate-400 font-tajawal hidden sm:block truncate">
              جماعة أنصار السنة المحمدية بالسودان – أمانة الدعوة (design.ansaralsuna.net)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {systemStatus?.database?.isPostgresActive ? (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              PostgreSQL متصل
            </span>
          ) : (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-950/70 text-brand-300 border border-brand-500/30">
              <span className="w-2 h-2 rounded-full bg-brand-400" />
              التخزين المحلي الآمن نشط
            </span>
          )}

          <button
            onClick={onLogout}
            className="min-h-10 min-w-10 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700"
            aria-label="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </button>
        </div>
      </header>

      {/* Toast Message Alert */}
      {message && (
        <div
          role="status"
          className={`fixed bottom-4 inset-x-4 sm:inset-x-auto sm:bottom-6 sm:left-6 mb-[env(safe-area-inset-bottom)] z-[60] py-3 px-5 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-2 transition-all ${
            message.type === 'success'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
              : 'bg-red-950 border-red-500 text-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-3 pb-6 md:p-6 gap-3 md:gap-6">
        {/* Navigation: horizontal tab bar on phones, sidebar on desktop */}
        <aside className="sticky top-[57px] z-20 -mx-3 px-3 py-2 bg-slate-950/95 backdrop-blur md:static md:mx-0 md:w-64 md:bg-slate-900/80 md:border md:border-slate-800 md:rounded-3xl md:p-4 shrink-0 md:self-start">
          <nav className="flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar snap-x" aria-label="أقسام لوحة الإدارة">
            {tabs.map(({ id, label, shortLabel, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                aria-current={activeTab === id ? 'page' : undefined}
                className={`shrink-0 snap-start md:w-full flex items-center gap-2 md:gap-3 px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-xs font-bold transition-all text-right whitespace-nowrap border ${
                  activeTab === id
                    ? 'bg-brand-500/20 text-brand-300 border-brand-500/30 shadow'
                    : 'text-slate-400 border-slate-800 md:border-transparent hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="md:hidden">{shortLabel}</span>
                <span className="hidden md:inline">{label}</span>
                {count !== undefined && (
                  <span className="md:mr-auto text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Tab Content Area */}
        <main className="flex-1 min-w-0 bg-slate-900/60 border border-slate-800 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 overflow-x-hidden">
          {/* ========================================================= */}
          {/* 1. SHEIKHS MANAGEMENT */}
          {/* ========================================================= */}
          {activeTab === 'sheikhs' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-brand-200 font-display">
                    إدارة المشايخ والدعاة
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    إضافة المشايخ، صورهم الرئيسية، ومخطوطات أسمائهم الرسمية
                  </p>
                </div>
                <button
                  onClick={() =>
                    setEditingSheikh({
                      full_name: '',
                      short_name: '',
                      title: 'فضيلة الشيخ',
                      role_description: '',
                      photo_url: '',
                      calligraphy_url: '',
                      bio: '',
                      is_active: true,
                    })
                  }
                  className="min-h-11 py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-on-brand font-bold text-xs flex items-center justify-center gap-1.5 shadow shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  إضافة شيخ جديد
                </button>
              </div>

              {/* Sheikhs Table / Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sheikhs.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3 sm:gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-800 border border-brand-500/30 overflow-hidden shrink-0 flex items-center justify-center">
                      {s.photo_url ? (
                        <img src={s.photo_url} alt={s.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-8 h-8 text-brand-400/50" />
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-bold text-white font-cairo truncate">
                        {s.title} {s.full_name}
                      </div>
                      <div className="text-xs text-brand-300 font-medium">
                        الاسم المختصر: {s.short_name}
                      </div>
                      <div className="text-xs text-slate-400 font-tajawal truncate mt-0.5">
                        {s.role_description || 'داعية وباحث إسلامي'}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        {getSheikhPhotos(s).length > 1 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-brand-950 text-brand-300 border border-brand-500/30">
                            {getSheikhPhotos(s).length} صور
                          </span>
                        )}
                        {s.calligraphy_url ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                            مخطوطة متوفرة
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            بدون مخطوطة
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => setEditingSheikh(s)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSheikh(s.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-red-950 text-red-400 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. MOSQUES MANAGEMENT */}
          {/* ========================================================= */}
          {activeTab === 'mosques' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-brand-200 font-display">
                    إدارة المساجد والمجمعات الدعوية
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    ربط المساجد بالولايات والمحليات ورفع صورها الرئيسية
                  </p>
                </div>
                <button
                  onClick={() =>
                    setEditingMosque({
                      name: '',
                      state_id: states[0]?.id || 1,
                      locality_id: localities[0]?.id || 1,
                      area_neighborhood: '',
                      address_details: '',
                      main_photo_url: '',
                      is_active: true,
                    })
                  }
                  className="min-h-11 py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-on-brand font-bold text-xs flex items-center justify-center gap-1.5 shadow shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  إضافة مسجد جديد
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mosques.map((m) => {
                  const st = states.find((s) => s.id === m.state_id);
                  const loc = localities.find((l) => l.id === m.locality_id);
                  return (
                    <div
                      key={m.id}
                      className="p-3 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3 sm:gap-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {m.main_photo_url ? (
                          <img src={m.main_photo_url} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-8 h-8 text-brand-400/40" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-bold text-white font-cairo truncate">{m.name}</div>
                        <div className="text-xs text-brand-300 mt-0.5">
                          {st?.name} - {loc?.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          {m.area_neighborhood || m.address_details || 'المنطقة غير محددة'}
                        </div>
                        {getMosquePhotos(m).length > 1 && (
                          <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded bg-brand-950 text-brand-300 border border-brand-500/30">
                            {getMosquePhotos(m).length} صور
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => setEditingMosque(m)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMosque(m.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-red-950 text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. LOCATIONS (STATES & LOCALITIES) */}
          {/* ========================================================= */}
          {activeTab === 'locations' && (
            <div className="space-y-8">
              {/* States Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <h3 className="text-base sm:text-lg font-bold text-brand-200 font-display">الولايات المعتمدة</h3>
                  <button
                    onClick={() => setEditingState({ name: '', code: '' })}
                    className="min-h-10 py-1.5 px-3 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> إضافة ولاية
                  </button>
                </div>

                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {states.map((st) => (
                    <div
                      key={st.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-white font-cairo">{st.name}</span>
                      <button
                        onClick={() => handleDeleteState(st.id)}
                        className="text-slate-500 hover:text-red-400 w-9 h-9 -my-1.5 -ml-1.5 flex items-center justify-center rounded-lg shrink-0"
                        aria-label="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Localities Section */}
              <div className="space-y-4 pt-6 border-t border-slate-800">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <h3 className="text-base sm:text-lg font-bold text-brand-200 font-display">المحليات والمدن</h3>
                  <button
                    onClick={() => setEditingLocality({ name: '', state_id: states[0]?.id || 1 })}
                    className="min-h-10 py-1.5 px-3 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> إضافة محلية
                  </button>
                </div>

                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {localities.map((loc) => {
                    const st = states.find((s) => s.id === loc.state_id);
                    return (
                      <div
                        key={loc.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{loc.name}</div>
                          <div className="text-[10px] text-brand-400/80">{st?.name}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteLocality(loc.id)}
                          className="text-slate-500 hover:text-red-400 w-9 h-9 -my-1.5 -ml-1.5 flex items-center justify-center rounded-lg shrink-0"
                        aria-label="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. VISUAL IDENTITY */}
          {/* ========================================================= */}
          {activeTab === 'identity' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h2 className="text-lg sm:text-xl font-black text-brand-200 font-display">
                  إدارة الهوية البصرية الرسمية
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  شعار الجماعة، ترويسة أمانة الدعوة، شريط الروابط والتواصل الموحد
                </p>
              </div>

              <form onSubmit={handleSaveIdentity} className="space-y-5 max-w-2xl">
                <div>
                  <label className="text-xs text-slate-300 block mb-1.5 font-bold">
                    نص الترويسة الرئيسي (السطر الأول):
                  </label>
                  <input
                    type="text"
                    value={identity.dawah_header_text}
                    onChange={(e) =>
                      setIdentity((prev) => ({ ...prev, dawah_header_text: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1.5 font-bold">
                    نص الترويسة الفرعي (السطر الثاني):
                  </label>
                  <input
                    type="text"
                    value={identity.dawah_header_subtext}
                    onChange={(e) =>
                      setIdentity((prev) => ({ ...prev, dawah_header_subtext: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1.5 font-bold">
                      حساب فيسبوك:
                    </label>
                    <input
                      type="text"
                      value={identity.facebook_handle}
                      onChange={(e) =>
                        setIdentity((prev) => ({ ...prev, facebook_handle: e.target.value }))
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1.5 font-bold">
                      قناة يوتيوب:
                    </label>
                    <input
                      type="text"
                      value={identity.youtube_handle}
                      onChange={(e) =>
                        setIdentity((prev) => ({ ...prev, youtube_handle: e.target.value }))
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1.5 font-bold">
                      قناة تليجرام:
                    </label>
                    <input
                      type="text"
                      value={identity.telegram_handle}
                      onChange={(e) =>
                        setIdentity((prev) => ({ ...prev, telegram_handle: e.target.value }))
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1.5 font-bold">
                      هاتف التواصل والاستفسار:
                    </label>
                    <input
                      type="text"
                      value={identity.contact_phone}
                      onChange={(e) =>
                        setIdentity((prev) => ({ ...prev, contact_phone: e.target.value }))
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="text-xs text-slate-300 block mb-1.5 font-bold">
                    شعار الجماعة الرسمي (ملف شفاف PNG أو SVG):
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <input
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'logos', (url) =>
                            setIdentity((prev) => ({ ...prev, group_logo_url: url }))
                          );
                        }
                      }}
                      className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-brand-300 hover:file:bg-slate-700"
                    />
                    {identity.group_logo_url && (
                      <span className="text-xs text-emerald-400">✓ تم حفظ الشعار المخصص</span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto min-h-12 py-3 px-6 rounded-xl bg-brand-500 hover:bg-brand-400 text-on-brand font-bold text-xs flex items-center justify-center gap-2 shadow"
                >
                  <Save className="w-4 h-4" />
                  حفظ تعديلات الهوية البصرية
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. TEMPLATES MANAGEMENT */}
          {/* ========================================================= */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h2 className="text-lg sm:text-xl font-black text-brand-200 font-display">
                  إدارة قوالب التصميم الثمانية
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  معاينة الأنماط وتفعيلها أو إيقافها للنظام
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-brand-200 font-cairo text-sm">{tpl.name}</div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          tpl.is_active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-950 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {tpl.is_active ? 'نشط ومتاح' : 'معطل'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-tajawal">
                      {tpl.description}
                    </p>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-500 truncate">معرف القالب: {tpl.id}</span>
                      <button
                        onClick={async () => {
                          const updated = !tpl.is_active;
                          await api.updateTemplate(tpl.id, { is_active: updated });
                          setTemplates((prev) =>
                            prev.map((t) => (t.id === tpl.id ? { ...t, is_active: updated } : t))
                          );
                          showMsg(`تم ${updated ? 'تفعيل' : 'تعطيل'} القالب بنجاح`);
                        }}
                        className="text-brand-400 hover:underline min-h-9 px-2 -mx-2"
                      >
                        {tpl.is_active ? 'تعطيل القالب' : 'تفعيل القالب'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. SAVED ANNOUNCEMENTS ARCHIVE */}
          {/* ========================================================= */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-brand-200 font-display">
                    أرشيف الإعلانات والتصاميم السابقة
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    إعادة فتح إعلان سابق وتعديله أو نسخه لإنشاء تصميم جديد بناءً عليه
                  </p>
                </div>
                <button
                  onClick={loadAnnouncements}
                  className="min-h-10 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center justify-center gap-1.5 self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  تحديث
                </button>
              </div>

              {/* Old announcements: style references for future designs */}
              <section className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-brand-200 font-display flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-400" />
                    الإعلانات القديمة (مرجع لأسلوب التصاميم الجديدة)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    ارفع تصاميم إعلاناتكم السابقة، وسيحلل الذكاء الاصطناعي أسلوب كل تصميم (الألوان، الخطوط، الزخارف) ويحوّله إلى
                    قالب جديد يُختار تلقائياً للإعلانات المشابهة في النوع.
                  </p>
                </div>

                {!aiEnabled && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-brand-950/40 border border-brand-500/30 text-brand-200 text-xs leading-relaxed">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-brand-400" />
                    <span>
                      التحليل الذكي غير مفعّل بعد: يحتاج مفتاح <span dir="ltr" className="font-mono">ANTHROPIC_API_KEY</span> في ملف
                      <span dir="ltr" className="font-mono"> .env </span>على السيرفر. يمكنك رفع الإعلانات الآن، وتحليلها لاحقاً بزر «تحليل».
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={referenceType}
                    onChange={(e) => setReferenceType(e.target.value)}
                    className="sm:w-56 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                    aria-label="نوع الإعلانات المرفوعة"
                  >
                    <option value="">نوع الإعلانات (اختياري)</option>
                    {ANNOUNCEMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 min-h-11 px-3 py-2.5 rounded-xl border-2 border-dashed text-xs font-bold transition-colors ${
                      referenceUploads > 0
                        ? 'border-slate-700 text-slate-500 cursor-wait'
                        : 'border-slate-700 hover:border-brand-400 text-brand-300 cursor-pointer'
                    }`}
                  >
                    {referenceUploads > 0 ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري رفع {referenceUploads}...
                      </>
                    ) : (
                      <>
                        <ImagePlus className="w-4 h-4" />
                        رفع إعلانات قديمة (PNG / JPG / WebP، حتى 5 ميجابايت للصورة)
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      disabled={referenceUploads > 0}
                      className="sr-only"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        e.target.value = '';
                        handleReferenceUpload(files);
                      }}
                    />
                  </label>
                </div>

                {styleReferences.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {styleReferences.map((ref) => (
                      <div key={ref.id} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col">
                        <div className="relative aspect-[4/5] bg-slate-800">
                          <img src={ref.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          <button
                            onClick={() => handleDeleteReference(ref.id)}
                            className="absolute top-1.5 left-1.5 w-8 h-8 rounded-lg bg-black/60 hover:bg-red-600 text-white flex items-center justify-center"
                            aria-label="حذف"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-2.5 space-y-1.5 text-[11px] flex-1 flex flex-col">
                          {ref.announcement_type && <div className="text-slate-400">{ref.announcement_type}</div>}
                          {ref.status === 'done' && ref.style ? (
                            <>
                              <div className="font-bold text-slate-100 text-xs">{ref.style.name}</div>
                              <div className="flex gap-1" aria-label="ألوان الأسلوب">
                                {[ref.style.palette.background_middle, ref.style.palette.accent, ref.style.palette.title, ref.style.palette.text].map(
                                  (c, i) => (
                                    <span key={i} className="w-4 h-4 rounded-full border border-slate-700" style={{ background: c }} />
                                  )
                                )}
                              </div>
                            </>
                          ) : ref.status === 'analyzing' ? (
                            <div className="flex items-center gap-1.5 text-brand-300">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              جاري تحليل الأسلوب...
                            </div>
                          ) : ref.status === 'error' ? (
                            <div className="text-red-400 leading-snug">{ref.error}</div>
                          ) : (
                            <div className="text-slate-500">بانتظار التحليل</div>
                          )}
                          {aiEnabled && ref.status !== 'analyzing' && (
                            <button
                              onClick={() => analyzeReference(ref.id)}
                              className="mt-auto min-h-8 w-full rounded-lg bg-brand-500/15 hover:bg-brand-500/25 text-brand-300 font-bold"
                            >
                              {ref.status === 'done' ? 'إعادة التحليل' : 'تحليل'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <h3 className="text-base font-bold text-brand-200 font-display pt-2">الإعلانات المحفوظة من المصمم</h3>

              {announcements.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  لا توجد إعلانات سابقة محفوظة في الأرشيف حتى الآن.
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white font-cairo text-sm">{item.title}</div>
                        <div className="text-brand-300 mt-0.5">
                          {item.type} | {item.date} ({item.dayName}) | {item.timeType}
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          القالب: {item.templateId || 'الذهبي'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {onEditAnnouncementInMainForm && (
                          <button
                            onClick={() => {
                              onEditAnnouncementInMainForm(item);
                              showMsg('تم استدعاء بيانات الإعلان إلى واجهة المصمم');
                            }}
                            className="flex-1 sm:flex-none min-h-10 py-2 px-3 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 font-bold"
                          >
                            نسخ وتعديل في المصمم
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (!confirm('حذف هذا الإعلان من الأرشيف؟')) return;
                            await api.deleteAnnouncement(item.id);
                            setAnnouncements((prev) => prev.filter((a) => a.id !== item.id));
                            showMsg('تم حذف الإعلان من الأرشيف');
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-red-400 hover:bg-red-950"
                          aria-label="حذف من الأرشيف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. SYSTEM STATUS, DATABASE & BACKUPS */}
          {/* ========================================================= */}
          {activeTab === 'system' && (
            <div className="space-y-8">
              <div className="pb-4 border-b border-slate-800">
                <h2 className="text-lg sm:text-xl font-black text-brand-200 font-display">
                  حالة النظام، قاعدة البيانات والنسخ الاحتياطي
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  إدارة اتصالات PostgreSQL، استخراج النسخ الاحتياطية وتأمين خادم VPS
                </p>
              </div>

              {/* Database Status Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-brand-300 flex items-center gap-2 font-display">
                  <Database className="w-4 h-4" />
                  حالة الاتصال بقاعدة البيانات:
                </h3>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                    <span className="text-slate-400">محرك قاعدة البيانات:</span>
                    <span className="font-bold text-white">{systemStatus?.database?.engine}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                    <span className="text-slate-400">التفاصيل والمعلومات:</span>
                    <span className="text-slate-300">{systemStatus?.database?.info}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                    <span className="text-slate-400">الدومين الرسمي:</span>
                    <span dir="ltr" className="text-brand-400 font-bold">
                      {systemStatus?.domain || 'design.ansaralsuna.net'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Backup & Restore Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-brand-300 flex items-center gap-2 font-display">
                  <Download className="w-4 h-4" />
                  النسخ الاحتياطي الفوري (JSON & SQL):
                </h3>
                <p className="text-xs text-slate-400">
                  يمكنك تنزيل نسخة احتياطية كاملة لجميع المشايخ والمساجد والولايات والإعلانات بضغطة زر لحفظها خارجياً أو استعادتها على سيرفر VPS.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => api.downloadBackup()}
                    className="w-full sm:w-auto min-h-11 py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-on-brand font-bold text-xs flex items-center justify-center gap-2 shadow"
                  >
                    <Download className="w-4 h-4" />
                    تنزيل نسخة احتياطية كاملة (JSON)
                  </button>
                </div>
              </div>

              {/* Admin Password Change Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 max-w-md">
                <h3 className="text-sm font-bold text-brand-300 flex items-center gap-2 font-display">
                  <KeyRound className="w-4 h-4" />
                  تغيير كلمة مرور المسؤول:
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">كلمة المرور الحالية:</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">كلمة المرور الجديدة:</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      required
                      minLength={6}
                    />
                  </div>
                  <button
                    type="submit"
                    className="min-h-11 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                  >
                    تحديث كلمة المرور
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT SHEIKH */}
      {/* ========================================================= */}
      {editingSheikh && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-safe max-w-lg w-full space-y-4 max-h-[92svh] overflow-y-auto overscroll-contain">
            <h3 className="text-base sm:text-lg font-bold text-brand-200 font-display">
              {editingSheikh.id ? 'تعديل بيانات الشيخ' : 'إضافة شيخ جديد'}
            </h3>

            <form onSubmit={handleSaveSheikh} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">الاسم الكامل الرسمي:</label>
                <input
                  type="text"
                  value={editingSheikh.full_name || ''}
                  onChange={(e) => setEditingSheikh({ ...editingSheikh, full_name: e.target.value })}
                  placeholder="مثال: فضيلة الشيخ الدكتور حسن أحمد الهواري"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">الاسم المختصر للإعلانات:</label>
                  <input
                    type="text"
                    value={editingSheikh.short_name || ''}
                    onChange={(e) => setEditingSheikh({ ...editingSheikh, short_name: e.target.value })}
                    placeholder="مثال: د. حسن الهواري"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">اللقب العلمي:</label>
                  <input
                    type="text"
                    value={editingSheikh.title || ''}
                    onChange={(e) => setEditingSheikh({ ...editingSheikh, title: e.target.value })}
                    placeholder="فضيلة الشيخ الدكتور"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">الصفة أو المنصب:</label>
                <input
                  type="text"
                  value={editingSheikh.role_description || ''}
                  onChange={(e) => setEditingSheikh({ ...editingSheikh, role_description: e.target.value })}
                  placeholder="مثال: رئيس المجلس العلمي لجماعة أنصار السنة المحمدية"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              {/* Photo Gallery: first photo is the main one */}
              <PhotoGalleryField
                label="صور الشيخ"
                category="sheikhs"
                photos={getSheikhPhotos(editingSheikh)}
                onChange={(update) =>
                  setEditingSheikh((prev) => {
                    if (!prev) return null;
                    const photos = update(getSheikhPhotos(prev));
                    return { ...prev, photo_url: photos[0] || '', additional_photos: photos.slice(1) };
                  })
                }
                onUploadingChange={setPhotosUploading}
                showMsg={showMsg}
              />

              {/* Calligraphy Upload */}
              <div>
                <label className="text-slate-300 block mb-1">مخطوطة الاسم (PNG شفاف أو SVG):</label>
                <input
                  type="file"
                  accept="image/png,image/svg+xml"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      handleFileUpload(f, 'calligraphy', (url) =>
                        setEditingSheikh((prev) => (prev ? { ...prev, calligraphy_url: url } : null))
                      );
                    }
                  }}
                  className="w-full text-slate-400 file:py-1.5 file:px-3 file:rounded-xl file:bg-slate-800 file:border-0 file:text-xs file:text-brand-300"
                />
                {editingSheikh.calligraphy_url && (
                  <div className="mt-1 text-emerald-400 text-[11px]">✓ تم حفظ المخطوطة</div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800 sticky bottom-0 bg-slate-900">
                <button
                  type="button"
                  onClick={() => setEditingSheikh(null)}
                  className="flex-1 sm:flex-none min-h-11 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading || photosUploading}
                  className="flex-1 sm:flex-none min-h-11 py-2 px-5 rounded-xl bg-brand-500 hover:bg-brand-400 text-on-brand font-bold disabled:opacity-50"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT MOSQUE */}
      {/* ========================================================= */}
      {editingMosque && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-safe max-w-lg w-full space-y-4 max-h-[92svh] overflow-y-auto overscroll-contain">
            <h3 className="text-base sm:text-lg font-bold text-brand-200 font-display">
              {editingMosque.id ? 'تعديل بيانات المسجد' : 'إضافة مسجد جديد'}
            </h3>

            <form onSubmit={handleSaveMosque} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">اسم المسجد أو المجمع:</label>
                <input
                  type="text"
                  value={editingMosque.name || ''}
                  onChange={(e) => setEditingMosque({ ...editingMosque, name: e.target.value })}
                  placeholder="مثال: مسجد المركز العام لجماعة أنصار السنة بالسجانة"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">الولاية:</label>
                  <select
                    value={editingMosque.state_id || ''}
                    onChange={(e) =>
                      setEditingMosque({
                        ...editingMosque,
                        state_id: Number(e.target.value),
                        locality_id: localities.find((l) => l.state_id === Number(e.target.value))?.id || 1,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    {states.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">المحلية:</label>
                  <select
                    value={editingMosque.locality_id || ''}
                    onChange={(e) =>
                      setEditingMosque({ ...editingMosque, locality_id: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    {localities
                      .filter((l) => l.state_id === editingMosque.state_id)
                      .map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">المنطقة أو الحي:</label>
                <input
                  type="text"
                  value={editingMosque.area_neighborhood || ''}
                  onChange={(e) =>
                    setEditingMosque({ ...editingMosque, area_neighborhood: e.target.value })
                  }
                  placeholder="مثال: حي السجانة، قرب السوق الشعبي"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              {/* Mosque Photo Gallery: first photo is the main one */}
              <PhotoGalleryField
                label="صور المسجد"
                category="mosques"
                photos={getMosquePhotos(editingMosque)}
                onChange={(update) =>
                  setEditingMosque((prev) => {
                    if (!prev) return null;
                    const photos = update(getMosquePhotos(prev));
                    return { ...prev, main_photo_url: photos[0] || '', additional_photos: photos.slice(1) };
                  })
                }
                onUploadingChange={setPhotosUploading}
                showMsg={showMsg}
              />

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800 sticky bottom-0 bg-slate-900">
                <button
                  type="button"
                  onClick={() => setEditingMosque(null)}
                  className="flex-1 sm:flex-none min-h-11 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading || photosUploading}
                  className="flex-1 sm:flex-none min-h-11 py-2 px-5 rounded-xl bg-brand-500 hover:bg-brand-400 text-on-brand font-bold disabled:opacity-50"
                >
                  حفظ المسجد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT STATE */}
      {/* ========================================================= */}
      {editingState && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-safe sm:max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-brand-200 font-display">إضافة ولاية جديدة</h3>
            <form onSubmit={handleSaveState} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">اسم الولاية:</label>
                <input
                  type="text"
                  placeholder="مثال: ولاية الخرطوم"
                  value={editingState.name || ''}
                  onChange={(e) => setEditingState({ ...editingState, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingState(null)}
                  className="flex-1 sm:flex-none min-h-11 py-1.5 px-3 rounded-lg bg-slate-800 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none min-h-11 py-1.5 px-4 rounded-lg bg-brand-500 text-on-brand font-bold"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT LOCALITY */}
      {/* ========================================================= */}
      {editingLocality && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-safe sm:max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-brand-200 font-display">إضافة محلية جديدة</h3>
            <form onSubmit={handleSaveLocality} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">الولاية التابعة لها:</label>
                <select
                  value={editingLocality.state_id || ''}
                  onChange={(e) =>
                    setEditingLocality({ ...editingLocality, state_id: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                >
                  {states.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">اسم المحلية:</label>
                <input
                  type="text"
                  placeholder="مثال: محلية أم درمان"
                  value={editingLocality.name || ''}
                  onChange={(e) => setEditingLocality({ ...editingLocality, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLocality(null)}
                  className="flex-1 sm:flex-none min-h-11 py-1.5 px-3 rounded-lg bg-slate-800 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none min-h-11 py-1.5 px-4 rounded-lg bg-brand-500 text-on-brand font-bold"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
