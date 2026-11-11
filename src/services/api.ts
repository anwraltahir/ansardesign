import { Sheikh, Mosque, State, Locality, VisualIdentity, DesignTemplate, AnnouncementFormData, StyleReference, AiSettings, AiProvider } from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('ansar_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Site password (visitor gate)
  async getSiteStatus(): Promise<{ protected: boolean; unlocked: boolean }> {
    const res = await fetch(`${API_BASE}/site/status`);
    return res.json();
  },

  async siteLogin(password: string) {
    const res = await fetch(`${API_BASE}/site/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'تعذر الدخول');
    return body;
  },

  async changeSitePassword(password: string) {
    const res = await fetch(`${API_BASE}/site/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ password }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'فشل تغيير كلمة مرور الموقع');
    return body;
  },

  // Auth
  async login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل تسجيل الدخول');
    if (data.token) {
      localStorage.setItem('ansar_admin_token', data.token);
    }
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('غير مصرح');
    return res.json();
  },

  logout() {
    localStorage.removeItem('ansar_admin_token');
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل تغيير كلمة المرور');
    return data;
  },

  // Sheikhs
  async getSheikhs(): Promise<Sheikh[]> {
    const res = await fetch(`${API_BASE}/sheikhs`);
    if (!res.ok) throw new Error('فشل جلب قائمة المشايخ');
    return res.json();
  },

  async saveSheikh(sheikh: Partial<Sheikh>) {
    const url = sheikh.id ? `${API_BASE}/sheikhs/${sheikh.id}` : `${API_BASE}/sheikhs`;
    const method = sheikh.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(sheikh),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل حفظ بيانات الشيخ');
    return data;
  },

  async deleteSheikh(id: number) {
    const res = await fetch(`${API_BASE}/sheikhs/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('فشل حذف الشيخ');
    return res.json();
  },

  // Mosques
  async getMosques(filters?: { state_id?: number; locality_id?: number }): Promise<Mosque[]> {
    const params = new URLSearchParams();
    if (filters?.state_id) params.append('state_id', String(filters.state_id));
    if (filters?.locality_id) params.append('locality_id', String(filters.locality_id));
    const res = await fetch(`${API_BASE}/mosques?${params.toString()}`);
    if (!res.ok) throw new Error('فشل جلب قائمة المساجد');
    return res.json();
  },

  async saveMosque(mosque: Partial<Mosque>) {
    const url = mosque.id ? `${API_BASE}/mosques/${mosque.id}` : `${API_BASE}/mosques`;
    const method = mosque.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(mosque),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل حفظ بيانات المسجد');
    return data;
  },

  async deleteMosque(id: number) {
    const res = await fetch(`${API_BASE}/mosques/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('فشل حذف المسجد');
    return res.json();
  },

  // States & Localities
  async getStates(): Promise<State[]> {
    const res = await fetch(`${API_BASE}/states`);
    if (!res.ok) throw new Error('فشل جلب قائمة الولايات');
    return res.json();
  },

  async saveState(state: Partial<State>) {
    const res = await fetch(`${API_BASE}/states`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(state),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل حفظ الولاية');
    return data;
  },

  async deleteState(id: number) {
    const res = await fetch(`${API_BASE}/states/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async getLocalities(stateId?: number): Promise<Locality[]> {
    const url = stateId ? `${API_BASE}/localities?state_id=${stateId}` : `${API_BASE}/localities`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('فشل جلب قائمة المحليات');
    return res.json();
  },

  async saveLocality(locality: Partial<Locality>) {
    const res = await fetch(`${API_BASE}/localities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(locality),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل حفظ المحلية');
    return data;
  },

  async deleteLocality(id: number) {
    const res = await fetch(`${API_BASE}/localities/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  // Visual Identity
  async getVisualIdentity(): Promise<VisualIdentity> {
    const res = await fetch(`${API_BASE}/identity`);
    if (!res.ok) throw new Error('فشل جلب الهوية البصرية');
    return res.json();
  },

  async updateVisualIdentity(identity: Partial<VisualIdentity>) {
    const res = await fetch(`${API_BASE}/identity`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(identity),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل تحديث الهوية البصرية');
    return data;
  },

  // Templates
  async getTemplates(): Promise<DesignTemplate[]> {
    const res = await fetch(`${API_BASE}/templates`);
    if (!res.ok) throw new Error('فشل جلب القوالب');
    return res.json();
  },

  async updateTemplate(id: string, updates: Partial<DesignTemplate>) {
    const res = await fetch(`${API_BASE}/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  // File Upload
  async uploadFile(file: File, category: 'sheikhs' | 'mosques' | 'logos' | 'calligraphy' | 'backgrounds' | 'designs' | 'references') {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload?category=${category}`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل رفع الملف');
    return data;
  },

  // Announcements
  async getAnnouncements(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/announcements`);
    if (!res.ok) throw new Error('فشل جلب الإعلانات');
    return res.json();
  },

  async saveAnnouncement(data: Partial<AnnouncementFormData>) {
    const res = await fetch(`${API_BASE}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'فشل حفظ الإعلان');
    return resData;
  },

  // Style references (past announcements) & AI analysis
  async getAiSettings(): Promise<AiSettings> {
    const res = await fetch(`${API_BASE}/settings/ai`, { headers: { ...getAuthHeader() } });
    if (!res.ok) throw new Error('فشل جلب إعدادات الذكاء الاصطناعي');
    return res.json();
  },

  async saveAiProvider(provider: AiProvider, apiKey: string, model: string): Promise<AiSettings> {
    const res = await fetch(`${API_BASE}/settings/ai/${provider}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ api_key: apiKey, model }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'فشل حفظ المفتاح');
    return body;
  },

  async removeAiProvider(provider: AiProvider): Promise<AiSettings> {
    const res = await fetch(`${API_BASE}/settings/ai/${provider}`, { method: 'DELETE', headers: { ...getAuthHeader() } });
    return res.json();
  },

  async setActiveAiProvider(provider: AiProvider): Promise<AiSettings> {
    const res = await fetch(`${API_BASE}/settings/ai/active`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ provider }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'فشل اختيار الأداة');
    return body;
  },

  async getStyleReferences(): Promise<StyleReference[]> {
    const res = await fetch(`${API_BASE}/style-references`, { headers: { ...getAuthHeader() } });
    if (!res.ok) throw new Error('فشل جلب الإعلانات المرجعية');
    return res.json();
  },

  async createStyleReference(data: { image_url: string; announcement_type?: string; notes?: string }): Promise<StyleReference> {
    const res = await fetch(`${API_BASE}/style-references`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'فشل حفظ الإعلان المرجعي');
    return body;
  },

  async analyzeStyleReference(id: number): Promise<{ reference: StyleReference; template: DesignTemplate }> {
    const res = await fetch(`${API_BASE}/style-references/${id}/analyze`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'فشل تحليل التصميم');
    return body;
  },

  async deleteStyleReference(id: number) {
    const res = await fetch(`${API_BASE}/style-references/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async deleteAnnouncement(id: number) {
    const res = await fetch(`${API_BASE}/announcements/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  // System Status
  async getSystemStatus() {
    const res = await fetch(`${API_BASE}/system/status`);
    return res.json();
  },

  async downloadBackup() {
    const res = await fetch(`${API_BASE}/system/backup`, {
      headers: { ...getAuthHeader() },
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ansar_design_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  async restoreBackup(backupJson: any) {
    const res = await fetch(`${API_BASE}/system/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(backupJson),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل استعادة النسخة');
    return data;
  },
};
