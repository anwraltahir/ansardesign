import React, { useState, useEffect } from 'react';
import {
  Sheikh,
  Mosque,
  State,
  Locality,
  VisualIdentity,
  DesignTemplate,
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
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<
    'sheikhs' | 'mosques' | 'locations' | 'identity' | 'media' | 'templates' | 'announcements' | 'system'
  >('sheikhs');

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

  // Fetch initial admin data
  useEffect(() => {
    loadAnnouncements();
    loadSystemStatus();
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* Top Admin Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-amber-200 font-cairo">
              لوحة إدارة المصمم الذكي
            </h1>
            <p className="text-xs text-slate-400 font-tajawal">
              جماعة أنصار السنة المحمدية بالسودان – أمانة الدعوة (design.ansaralsuna.net)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {systemStatus?.database?.isPostgresActive ? (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              PostgreSQL متصل
            </span>
          ) : (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-950/70 text-amber-300 border border-amber-500/30">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              التخزين المحلي الآمن نشط
            </span>
          )}

          <button
            onClick={onLogout}
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            تسجيل الخروج
          </button>
        </div>
      </header>

      {/* Toast Message Alert */}
      {message && (
        <div
          className={`fixed bottom-6 left-6 z-50 py-3 px-5 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-2 transition-all ${
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
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shrink-0 flex flex-col gap-1.5 self-start">
          <button
            onClick={() => setActiveTab('sheikhs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-right ${
              activeTab === 'sheikhs'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. إدارة المشايخ</span>
            <span className="mr-auto text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {sheikhs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mosques')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-right ${
              activeTab === 'mosques'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>2. إدارة المساجد</span>
            <span className="mr-auto text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {mosques.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('locations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-right ${
              activeTab === 'locations'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>3. الولايات والمحليات</span>
            <span className="mr-auto text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {states.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('identity')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-right ${
              activeTab === 'identity'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>4. الهوية البصرية الرسمية</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-right ${
              activeTab === 'templates'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>5. قوالب التصميم (8)</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-right ${
              activeTab === 'announcements'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>6. أرشيف الإعلانات المحفوظة</span>
            <span className="mr-auto text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {announcements.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-right ${
              activeTab === 'system'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>7. قاعدة البيانات والنسخ الاحتياطي</span>
          </button>
        </aside>

        {/* Tab Content Area */}
        <main className="flex-1 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 overflow-x-hidden">
          {/* ========================================================= */}
          {/* 1. SHEIKHS MANAGEMENT */}
          {/* ========================================================= */}
          {activeTab === 'sheikhs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-black text-amber-200 font-cairo">
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
                  className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
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
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full bg-slate-800 border border-amber-500/30 overflow-hidden shrink-0 flex items-center justify-center">
                      {s.photo_url ? (
                        <img src={s.photo_url} alt={s.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-8 h-8 text-amber-400/50" />
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-bold text-white font-cairo truncate">
                        {s.title} {s.full_name}
                      </div>
                      <div className="text-xs text-amber-300 font-medium">
                        الاسم المختصر: {s.short_name}
                      </div>
                      <div className="text-xs text-slate-400 font-tajawal truncate mt-0.5">
                        {s.role_description || 'داعية وباحث إسلامي'}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
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
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSheikh(s.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-red-950 text-red-400 transition-colors"
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
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-black text-amber-200 font-cairo">
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
                  className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
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
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {m.main_photo_url ? (
                          <img src={m.main_photo_url} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-8 h-8 text-amber-400/40" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-bold text-white font-cairo truncate">{m.name}</div>
                        <div className="text-xs text-amber-300 mt-0.5">
                          {st?.name} - {loc?.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          {m.area_neighborhood || m.address_details || 'المنطقة غير محددة'}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => setEditingMosque(m)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMosque(m.id)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-red-950 text-red-400"
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
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-amber-200 font-cairo">الولايات المعتمدة</h3>
                  <button
                    onClick={() => setEditingState({ name: '', code: '' })}
                    className="py-1.5 px-3 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> إضافة ولاية
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {states.map((st) => (
                    <div
                      key={st.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-white font-cairo">{st.name}</span>
                      <button
                        onClick={() => handleDeleteState(st.id)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Localities Section */}
              <div className="space-y-4 pt-6 border-t border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-amber-200 font-cairo">المحليات والمدن</h3>
                  <button
                    onClick={() => setEditingLocality({ name: '', state_id: states[0]?.id || 1 })}
                    className="py-1.5 px-3 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> إضافة محلية
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {localities.map((loc) => {
                    const st = states.find((s) => s.id === loc.state_id);
                    return (
                      <div
                        key={loc.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{loc.name}</div>
                          <div className="text-[10px] text-amber-400/80">{st?.name}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteLocality(loc.id)}
                          className="text-slate-500 hover:text-red-400 p-1"
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
                <h2 className="text-xl font-black text-amber-200 font-cairo">
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
                  <div className="flex items-center gap-4">
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
                      className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-300 hover:file:bg-slate-700"
                    />
                    {identity.group_logo_url && (
                      <span className="text-xs text-emerald-400">✓ تم حفظ الشعار المخصص</span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow"
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
                <h2 className="text-xl font-black text-amber-200 font-cairo">
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
                      <div className="font-bold text-amber-200 font-cairo text-sm">{tpl.name}</div>
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
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500">معرف القالب: {tpl.id}</span>
                      <button
                        onClick={async () => {
                          const updated = !tpl.is_active;
                          await api.updateTemplate(tpl.id, { is_active: updated });
                          setTemplates((prev) =>
                            prev.map((t) => (t.id === tpl.id ? { ...t, is_active: updated } : t))
                          );
                          showMsg(`تم ${updated ? 'تفعيل' : 'تعطيل'} القالب بنجاح`);
                        }}
                        className="text-amber-400 hover:underline"
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
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-black text-amber-200 font-cairo">
                    أرشيف الإعلانات والتصاميم السابقة
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    إعادة فتح إعلان سابق وتعديله أو نسخه لإنشاء تصميم جديد بناءً عليه
                  </p>
                </div>
                <button
                  onClick={loadAnnouncements}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  تحديث
                </button>
              </div>

              {announcements.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  لا توجد إعلانات سابقة محفوظة في الأرشيف حتى الآن.
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white font-cairo text-sm">{item.title}</div>
                        <div className="text-amber-300 mt-0.5">
                          {item.type} | {item.date} ({item.dayName}) | {item.timeType}
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          القالب: {item.templateId || 'الذهبي'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {onEditAnnouncementInMainForm && (
                          <button
                            onClick={() => {
                              onEditAnnouncementInMainForm(item);
                              showMsg('تم استدعاء بيانات الإعلان إلى واجهة المصمم');
                            }}
                            className="py-1.5 px-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-bold"
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
                          className="p-2 rounded-xl bg-slate-800 text-red-400 hover:bg-red-950"
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
                <h2 className="text-xl font-black text-amber-200 font-cairo">
                  حالة النظام، قاعدة البيانات والنسخ الاحتياطي
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  إدارة اتصالات PostgreSQL، استخراج النسخ الاحتياطية وتأمين خادم VPS
                </p>
              </div>

              {/* Database Status Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 font-cairo">
                  <Database className="w-4 h-4" />
                  حالة الاتصال بقاعدة البيانات:
                </h3>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">محرك قاعدة البيانات:</span>
                    <span className="font-bold text-white">{systemStatus?.database?.engine}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">التفاصيل والمعلومات:</span>
                    <span className="text-slate-300">{systemStatus?.database?.info}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">الدومين الرسمي:</span>
                    <span className="text-amber-400 font-bold dir-ltr">
                      {systemStatus?.domain || 'design.ansaralsuna.net'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Backup & Restore Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 font-cairo">
                  <Download className="w-4 h-4" />
                  النسخ الاحتياطي الفوري (JSON & SQL):
                </h3>
                <p className="text-xs text-slate-400">
                  يمكنك تنزيل نسخة احتياطية كاملة لجميع المشايخ والمساجد والولايات والإعلانات بضغطة زر لحفظها خارجياً أو استعادتها على سيرفر VPS.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => api.downloadBackup()}
                    className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow"
                  >
                    <Download className="w-4 h-4" />
                    تنزيل نسخة احتياطية كاملة (JSON)
                  </button>
                </div>
              </div>

              {/* Admin Password Change Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 max-w-md">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 font-cairo">
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
                    className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-amber-200 font-cairo">
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">الاسم المختصر للإعلانات:</label>
                  <input
                    type="text"
                    value={editingSheikh.short_name || ''}
                    onChange={(e) => setEditingSheikh({ ...editingSheikh, short_name: e.target.value })}
                    placeholder="مثال: د. حسن الهواري"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="text-slate-300 block mb-1">الصورة الشخصية الرئيسية:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      handleFileUpload(f, 'sheikhs', (url) =>
                        setEditingSheikh((prev) => (prev ? { ...prev, photo_url: url } : null))
                      );
                    }
                  }}
                  className="w-full text-slate-400 file:py-1.5 file:px-3 file:rounded-xl file:bg-slate-800 file:border-0 file:text-xs file:text-amber-300"
                />
                {editingSheikh.photo_url && (
                  <div className="mt-1 text-emerald-400 text-[11px]">✓ تم حفظ مسار الصورة</div>
                )}
              </div>

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
                  className="w-full text-slate-400 file:py-1.5 file:px-3 file:rounded-xl file:bg-slate-800 file:border-0 file:text-xs file:text-amber-300"
                />
                {editingSheikh.calligraphy_url && (
                  <div className="mt-1 text-emerald-400 text-[11px]">✓ تم حفظ المخطوطة</div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSheikh(null)}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-amber-200 font-cairo">
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              {/* Mosque Photo */}
              <div>
                <label className="text-slate-300 block mb-1">الصورة الرئيسية للمسجد:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      handleFileUpload(f, 'mosques', (url) =>
                        setEditingMosque((prev) => (prev ? { ...prev, main_photo_url: url } : null))
                      );
                    }
                  }}
                  className="w-full text-slate-400 file:py-1.5 file:px-3 file:rounded-xl file:bg-slate-800 file:border-0 file:text-xs file:text-amber-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMosque(null)}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-amber-200 font-cairo">إضافة ولاية جديدة</h3>
            <form onSubmit={handleSaveState} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">اسم الولاية:</label>
                <input
                  type="text"
                  placeholder="مثال: ولاية الخرطوم"
                  value={editingState.name || ''}
                  onChange={(e) => setEditingState({ ...editingState, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingState(null)}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 rounded-lg bg-amber-500 text-slate-950 font-bold"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-amber-200 font-cairo">إضافة محلية جديدة</h3>
            <form onSubmit={handleSaveLocality} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">الولاية التابعة لها:</label>
                <select
                  value={editingLocality.state_id || ''}
                  onChange={(e) =>
                    setEditingLocality({ ...editingLocality, state_id: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLocality(null)}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 rounded-lg bg-amber-500 text-slate-950 font-bold"
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
