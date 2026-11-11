import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// Define directories for persistent uploads
export const UPLOAD_DIRS = {
  sheikhs: path.join(process.cwd(), 'uploads', 'sheikhs'),
  mosques: path.join(process.cwd(), 'uploads', 'mosques'),
  logos: path.join(process.cwd(), 'uploads', 'logos'),
  calligraphy: path.join(process.cwd(), 'uploads', 'calligraphy'),
  backgrounds: path.join(process.cwd(), 'uploads', 'backgrounds'),
  designs: path.join(process.cwd(), 'uploads', 'designs'),
};

// Ensure all upload directories exist
for (const dir of Object.values(UPLOAD_DIRS)) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// PostgreSQL Connection configuration
const dbConfig: pg.PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST || process.env.SQL_HOST || '127.0.0.1',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || process.env.SQL_USER || 'postgres',
  password: process.env.PGPASSWORD || process.env.SQL_PASSWORD,
  database: process.env.PGDATABASE || process.env.SQL_DB_NAME || 'ansar_design_db',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
};

let pool: pg.Pool | null = null;
let isPostgresConnected = false;
let postgresErrorReason: string | null = null;

// Initialize Postgres Pool if configured
if (process.env.DATABASE_URL || (process.env.PGPASSWORD && process.env.PGHOST)) {
  try {
    pool = new Pool(dbConfig);
    pool.query('SELECT NOW()', (err) => {
      if (err) {
        console.warn('⚠️ PostgreSQL connection failed, switching to local persistent engine:', err.message);
        isPostgresConnected = false;
        postgresErrorReason = err.message;
      } else {
        console.log('✅ Connected to PostgreSQL database successfully.');
        isPostgresConnected = true;
      }
    });
  } catch (err: any) {
    console.warn('⚠️ Could not initialize PostgreSQL Pool:', err.message);
    isPostgresConnected = false;
    postgresErrorReason = err.message;
  }
} else {
  postgresErrorReason = 'لم يتم ضبط بيانات الاتصال بـ PostgreSQL في ملف البيئة (DATABASE_URL أو PGHOST/PGPASSWORD). يعمل النظام حالياً بنمط التخزين المحلي الآمن.';
}

// Local Persistent Store fallback
const STORE_FILE = path.join(process.cwd(), 'uploads', 'local_database_store.json');

export interface AppStore {
  states: any[];
  localities: any[];
  sheikhs: any[];
  mosques: any[];
  visualIdentity: any;
  templates: any[];
  mediaAssets: any[];
  announcements: any[];
  admins: any[];
}

// Initial realistic data for Ansar Al-Sunna Sudan
const initialStates = [
  { id: 1, name: 'ولاية الخرطوم', code: 'KRT', is_active: true },
  { id: 2, name: 'ولاية الجزيرة', code: 'GZ', is_active: true },
  { id: 3, name: 'ولاية البحر الأحمر', code: 'RS', is_active: true },
  { id: 4, name: 'ولاية نهر النيل', code: 'RN', is_active: true },
  { id: 5, name: 'الولاية الشمالية', code: 'NOR', is_active: true },
  { id: 6, name: 'ولاية القضارف', code: 'GD', is_active: true },
  { id: 7, name: 'ولاية كسلا', code: 'KS', is_active: true },
  { id: 8, name: 'ولاية سنار', code: 'SN', is_active: true },
  { id: 9, name: 'ولاية النيل الأبيض', code: 'WN', is_active: true },
];

const initialLocalities = [
  // Khartoum
  { id: 1, state_id: 1, name: 'محلية الخرطوم', is_active: true },
  { id: 2, state_id: 1, name: 'محلية بحري', is_active: true },
  { id: 3, state_id: 1, name: 'محلية أم درمان', is_active: true },
  { id: 4, state_id: 1, name: 'محلية شرق النيل', is_active: true },
  { id: 5, state_id: 1, name: 'محلية جبل أولياء', is_active: true },
  { id: 6, state_id: 1, name: 'محلية كرري', is_active: true },
  // Gezira
  { id: 7, state_id: 2, name: 'محلية مدني الكبرى', is_active: true },
  { id: 8, state_id: 2, name: 'محلية المناقل', is_active: true },
  { id: 9, state_id: 2, name: 'محلية الحصاحيصا', is_active: true },
  // Red Sea
  { id: 10, state_id: 3, name: 'محلية بورتسودان', is_active: true },
  { id: 11, state_id: 3, name: 'محلية سواكن', is_active: true },
  // River Nile
  { id: 12, state_id: 4, name: 'محلية عطبرة', is_active: true },
  { id: 13, state_id: 4, name: 'محلية الدامر', is_active: true },
  { id: 14, state_id: 4, name: 'محلية شندي', is_active: true },
];

const initialSheikhs = [
  {
    id: 1,
    full_name: 'د. إسماعيل عثمان محمد الماحي',
    short_name: 'د. إسماعيل عثمان',
    title: 'فضيلة الشيخ الدكتور',
    role_description: 'الرئيس العام لجماعة أنصار السنة المحمدية بالسودان',
    calligraphy_url: '',
    photo_url: '',
    additional_photos: [],
    bio: 'الرئيس العام لجماعة أنصار السنة المحمدية بالسودان، عضو مجمع الفقه الإسلامي، وداعية وأستاذ جامعي.',
    is_active: true,
  },
  {
    id: 2,
    full_name: 'د. حسن أحمد الهواري',
    short_name: 'د. حسن الهواري',
    title: 'فضيلة الشيخ الدكتور',
    role_description: 'رئيس المجلس العلمي لجماعة أنصار السنة المحمدية',
    calligraphy_url: '',
    photo_url: '',
    additional_photos: [],
    bio: 'رئيس المجلس العلمي والدعوي، باحث ومحاضر متميز في العقيدة والسنة النبوية.',
    is_active: true,
  },
  {
    id: 3,
    full_name: 'الشيخ مزمل فقيري',
    short_name: 'الشيخ مزمل فقيري',
    title: 'فضيلة الشيخ الداعية',
    role_description: 'الداعية المعروف ومسؤول القوافل الدعوية والمناظرات',
    calligraphy_url: '',
    photo_url: '',
    additional_photos: [],
    bio: 'داعية معروف بجهوده الكبيرة في الدعوة إلى التوحيد ونشر السنة والرد على الشبهات.',
    is_active: true,
  },
  {
    id: 4,
    full_name: 'الشيخ مصطفى ناجي',
    short_name: 'الشيخ مصطفى ناجي',
    title: 'فضيلة الشيخ',
    role_description: 'أمين أمانة الدعوة بالمركز العام',
    calligraphy_url: '',
    photo_url: '',
    additional_photos: [],
    bio: 'أمين أمانة الدعوة، مشرف على البرامج الدعوية والدورات العلمية بمختلف ولايات السودان.',
    is_active: true,
  },
  {
    id: 5,
    full_name: 'د. محمد الأمين إسماعيل',
    short_name: 'د. محمد الأمين',
    title: 'فضيلة الشيخ الدكتور',
    role_description: 'عضو المجلس العلمي وخطيب جامع كافوري',
    calligraphy_url: '',
    photo_url: '',
    additional_photos: [],
    bio: 'عضو هيئة علماء السودان والمجلس العلمي، خطيب ومفسر ومدرس للعلوم الشرعية.',
    is_active: true,
  },
  {
    id: 6,
    full_name: 'الشيخ أبو زيد محمد حمزة رحمه الله',
    short_name: 'الشيخ أبو زيد رحمه الله',
    title: 'الشيخ الوالد المؤسس',
    role_description: 'الرئيس العام الأسبق لجماعة أنصار السنة المحمدية',
    calligraphy_url: '',
    photo_url: '',
    additional_photos: [],
    bio: 'علم من أعلام الدعوة السلفية في السودان والعالم الإسلامي ومؤسس مجمع المركز العام بالسجانة.',
    is_active: true,
  },
];

const initialMosques = [
  {
    id: 1,
    name: 'مسجد المركز العام لجماعة أنصار السنة',
    state_id: 1,
    locality_id: 1,
    area_neighborhood: 'السجانة - الخرطوم',
    address_details: 'المقر الرئيسي لأمانة الدعوة والمجلس العلمي',
    main_photo_url: '',
    additional_photos: [],
    is_active: true,
  },
  {
    id: 2,
    name: 'مسجد ومجمع الإمام البخاري الإسلامي',
    state_id: 1,
    locality_id: 6,
    area_neighborhood: 'الثورة الحارة الرابعة - كرري',
    address_details: 'مجمع دعوي متكامل وقاعة للمحاضرات',
    main_photo_url: '',
    additional_photos: [],
    is_active: true,
  },
  {
    id: 3,
    name: 'مسجد أنصار السنة المركزي - بحري',
    state_id: 1,
    locality_id: 2,
    area_neighborhood: 'المزاد - بحري',
    address_details: 'قرب ميدان المزاد',
    main_photo_url: '',
    additional_photos: [],
    is_active: true,
  },
  {
    id: 4,
    name: 'مسجد ومجمع الفتح الإسلامي',
    state_id: 1,
    locality_id: 1,
    area_neighborhood: 'العمارات شارع 15',
    address_details: 'الخرطوم العمارات',
    main_photo_url: '',
    additional_photos: [],
    is_active: true,
  },
  {
    id: 5,
    name: 'مسجد التوحيد الكبير - ودمدني',
    state_id: 2,
    locality_id: 7,
    area_neighborhood: 'حي الدباغة - ودمدني',
    address_details: 'المركز الرئيسي للجماعة بولاية الجزيرة',
    main_photo_url: '',
    additional_photos: [],
    is_active: true,
  },
  {
    id: 6,
    name: 'مجمع أنصار السنة الإسلامي - بورتسودان',
    state_id: 3,
    locality_id: 10,
    area_neighborhood: 'حي الشاطئ - بورتسودان',
    address_details: 'المقر الرئيسي للجماعة بالبحر الأحمر',
    main_photo_url: '',
    additional_photos: [],
    is_active: true,
  },
  {
    id: 7,
    name: 'مسجد الإمام أحمد بن حنبل - عطبرة',
    state_id: 4,
    locality_id: 12,
    area_neighborhood: 'حي الميدان - عطبرة',
    address_details: 'عطبرة - ولاية نهر النيل',
    main_photo_url: '',
    additional_photos: [],
    is_active: true,
  },
];

const initialVisualIdentity = {
  group_logo_url: '',
  dawah_header_text: 'جماعة أنصار السنة المحمدية بالسودان',
  dawah_header_subtext: 'الأمانة العامة للدعوة والتعليم - إدارة البرامج العلمية',
  website_url: 'https://design.ansaralsuna.net',
  official_site: 'https://ansaralsuna.net',
  facebook_handle: 'ansaralsunasudan',
  youtube_handle: 'ansaralsunasudan',
  telegram_handle: 'ansaralsunasudan',
  contact_phone: '+249 91 234 5678',
};

const initialTemplates = [
  {
    id: 'golden-heritage',
    name: 'التصميم الذهبي التراثي',
    description: 'إطار هندسي إسلامي ذهبي فخم مع زخارف مشربية وألوان ملكية داكنة تناسب المحاضرات الكبرى.',
    category: 'royal',
    is_active: true,
  },
  {
    id: 'official-blue',
    name: 'التصميم الأزرق الرسمي',
    description: 'طابع كحلي نيلي رسمي مستوحى من مطبوعات المركز العام والملتقيات الدعوية.',
    category: 'official',
    is_active: true,
  },
  {
    id: 'emerald-turquoise',
    name: 'التصميم الأخضر والفيروزي',
    description: 'ألوان إسلامية راقية تجمع بين الأخضر الزمرّدي ولمسات ذهبية تناسب خطب الجمعة والمواسم.',
    category: 'islamic',
    is_active: true,
  },
  {
    id: 'mosque-architecture',
    name: 'التصميم المعماري للمساجد',
    description: 'يبرز مآذن وقباب المساجد في خلفية التصميم بتدرجات لونية هادئة وفخمة.',
    category: 'architecture',
    is_active: true,
  },
  {
    id: 'classic-islamic',
    name: 'التصميم الإسلامي الكلاسيكي',
    description: 'زخارف نباتية وهندسية كلاسيكية مع تباين عالي لقراءة مريحة وواضحة جداً.',
    category: 'classic',
    is_active: true,
  },
  {
    id: 'sheikh-portrait',
    name: 'تصميم التركيز على صورة الشيخ',
    description: 'مساحة بصرية كبرى ومؤثرات إضاءة تسلط الضوء على صورة الشيخ ومخطوطة اسمه.',
    category: 'portrait',
    is_active: true,
  },
  {
    id: 'minimalist-clean',
    name: 'التصميم البسيط (Minimal)',
    description: 'تصميم عصري نقي بمساحات بيضاء أو رمادية داكنة مع خطوط عربية واضحة بدون مبالغة.',
    category: 'minimal',
    is_active: true,
  },
  {
    id: 'modern-geometric',
    name: 'التصميم الإسلامي الحديث',
    description: 'أنماط هندسية مضلعة عصرية مستوحاة من العمارة الإسلامية المعاصرة.',
    category: 'modern',
    is_active: true,
  },
];

// Helper to load or initialize store
function loadLocalStore(): AppStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading local store:', err);
  }

  const initialStore: AppStore = {
    states: initialStates,
    localities: initialLocalities,
    sheikhs: initialSheikhs,
    mosques: initialMosques,
    visualIdentity: initialVisualIdentity,
    templates: initialTemplates,
    mediaAssets: [],
    announcements: [],
    admins: [],
  };

  saveLocalStore(initialStore);
  return initialStore;
}

export function saveLocalStore(store: AppStore): void {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local store:', err);
  }
}

// In-memory reference that stays in sync with file
let memoryStore = loadLocalStore();

export const db = {
  isPostgresConnected: () => isPostgresConnected,
  getPostgresErrorReason: () => postgresErrorReason,

  // Raw query for Postgres when available
  async query(text: string, params?: any[]) {
    if (pool && isPostgresConnected) {
      return pool.query(text, params);
    }
    throw new Error('PostgreSQL is not connected. Use high-level db methods.');
  },

  // Sheikhs
  async getSheikhs() {
    return memoryStore.sheikhs;
  },

  async getSheikhById(id: number) {
    return memoryStore.sheikhs.find((s) => s.id === Number(id)) || null;
  },

  async saveSheikh(sheikhData: any) {
    if (sheikhData.id) {
      const idx = memoryStore.sheikhs.findIndex((s) => s.id === Number(sheikhData.id));
      if (idx !== -1) {
        memoryStore.sheikhs[idx] = { ...memoryStore.sheikhs[idx], ...sheikhData, updated_at: new Date().toISOString() };
        saveLocalStore(memoryStore);
        return memoryStore.sheikhs[idx];
      }
    }
    const newId = memoryStore.sheikhs.length ? Math.max(...memoryStore.sheikhs.map((s) => s.id)) + 1 : 1;
    const newSheikh = {
      ...sheikhData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryStore.sheikhs.push(newSheikh);
    saveLocalStore(memoryStore);
    return newSheikh;
  },

  async deleteSheikh(id: number) {
    memoryStore.sheikhs = memoryStore.sheikhs.filter((s) => s.id !== Number(id));
    saveLocalStore(memoryStore);
    return true;
  },

  // Mosques
  async getMosques(filters?: { state_id?: number; locality_id?: number }) {
    let result = [...memoryStore.mosques];
    if (filters?.state_id) {
      result = result.filter((m) => m.state_id === Number(filters.state_id));
    }
    if (filters?.locality_id) {
      result = result.filter((m) => m.locality_id === Number(filters.locality_id));
    }
    return result;
  },

  async getMosqueById(id: number) {
    return memoryStore.mosques.find((m) => m.id === Number(id)) || null;
  },

  async saveMosque(mosqueData: any) {
    if (mosqueData.id) {
      const idx = memoryStore.mosques.findIndex((m) => m.id === Number(mosqueData.id));
      if (idx !== -1) {
        memoryStore.mosques[idx] = { ...memoryStore.mosques[idx], ...mosqueData, updated_at: new Date().toISOString() };
        saveLocalStore(memoryStore);
        return memoryStore.mosques[idx];
      }
    }
    const newId = memoryStore.mosques.length ? Math.max(...memoryStore.mosques.map((m) => m.id)) + 1 : 1;
    const newMosque = {
      ...mosqueData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryStore.mosques.push(newMosque);
    saveLocalStore(memoryStore);
    return newMosque;
  },

  async deleteMosque(id: number) {
    memoryStore.mosques = memoryStore.mosques.filter((m) => m.id !== Number(id));
    saveLocalStore(memoryStore);
    return true;
  },

  // Locations (States & Localities)
  async getStates() {
    return memoryStore.states;
  },

  async saveState(stateData: any) {
    if (stateData.id) {
      const idx = memoryStore.states.findIndex((s) => s.id === Number(stateData.id));
      if (idx !== -1) {
        memoryStore.states[idx] = { ...memoryStore.states[idx], ...stateData };
        saveLocalStore(memoryStore);
        return memoryStore.states[idx];
      }
    }
    const newId = memoryStore.states.length ? Math.max(...memoryStore.states.map((s) => s.id)) + 1 : 1;
    const newState = { ...stateData, id: newId, is_active: true };
    memoryStore.states.push(newState);
    saveLocalStore(memoryStore);
    return newState;
  },

  async deleteState(id: number) {
    memoryStore.states = memoryStore.states.filter((s) => s.id !== Number(id));
    memoryStore.localities = memoryStore.localities.filter((l) => l.state_id !== Number(id));
    saveLocalStore(memoryStore);
    return true;
  },

  async getLocalities(stateId?: number) {
    if (stateId) {
      return memoryStore.localities.filter((l) => l.state_id === Number(stateId));
    }
    return memoryStore.localities;
  },

  async saveLocality(localityData: any) {
    if (localityData.id) {
      const idx = memoryStore.localities.findIndex((l) => l.id === Number(localityData.id));
      if (idx !== -1) {
        memoryStore.localities[idx] = { ...memoryStore.localities[idx], ...localityData };
        saveLocalStore(memoryStore);
        return memoryStore.localities[idx];
      }
    }
    const newId = memoryStore.localities.length ? Math.max(...memoryStore.localities.map((l) => l.id)) + 1 : 1;
    const newLocality = { ...localityData, id: newId, is_active: true };
    memoryStore.localities.push(newLocality);
    saveLocalStore(memoryStore);
    return newLocality;
  },

  async deleteLocality(id: number) {
    memoryStore.localities = memoryStore.localities.filter((l) => l.id !== Number(id));
    saveLocalStore(memoryStore);
    return true;
  },

  // Visual Identity
  async getVisualIdentity() {
    return memoryStore.visualIdentity;
  },

  async updateVisualIdentity(data: any) {
    memoryStore.visualIdentity = { ...memoryStore.visualIdentity, ...data, updated_at: new Date().toISOString() };
    saveLocalStore(memoryStore);
    return memoryStore.visualIdentity;
  },

  // Templates
  async getTemplates() {
    return memoryStore.templates;
  },

  async updateTemplate(id: string, updates: any) {
    const idx = memoryStore.templates.findIndex((t) => t.id === id);
    if (idx !== -1) {
      memoryStore.templates[idx] = { ...memoryStore.templates[idx], ...updates };
      saveLocalStore(memoryStore);
      return memoryStore.templates[idx];
    }
    return null;
  },

  // Announcements
  async getAnnouncements() {
    return memoryStore.announcements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getAnnouncementById(id: number) {
    return memoryStore.announcements.find((a) => a.id === Number(id)) || null;
  },

  async saveAnnouncement(announcementData: any) {
    if (announcementData.id) {
      const idx = memoryStore.announcements.findIndex((a) => a.id === Number(announcementData.id));
      if (idx !== -1) {
        memoryStore.announcements[idx] = {
          ...memoryStore.announcements[idx],
          ...announcementData,
          updated_at: new Date().toISOString(),
        };
        saveLocalStore(memoryStore);
        return memoryStore.announcements[idx];
      }
    }
    const newId = memoryStore.announcements.length ? Math.max(...memoryStore.announcements.map((a) => a.id)) + 1 : 1;
    const newRecord = {
      ...announcementData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryStore.announcements.push(newRecord);
    saveLocalStore(memoryStore);
    return newRecord;
  },

  async deleteAnnouncement(id: number) {
    memoryStore.announcements = memoryStore.announcements.filter((a) => a.id !== Number(id));
    saveLocalStore(memoryStore);
    return true;
  },

  // Media Assets
  async getMediaAssets(category?: string) {
    if (category) {
      return memoryStore.mediaAssets.filter((m) => m.category === category);
    }
    return memoryStore.mediaAssets;
  },

  async addMediaAsset(asset: any) {
    const newId = memoryStore.mediaAssets.length ? Math.max(...memoryStore.mediaAssets.map((a) => a.id)) + 1 : 1;
    const newAsset = { ...asset, id: newId, created_at: new Date().toISOString() };
    memoryStore.mediaAssets.push(newAsset);
    saveLocalStore(memoryStore);
    return newAsset;
  },

  async deleteMediaAsset(id: number) {
    memoryStore.mediaAssets = memoryStore.mediaAssets.filter((a) => a.id !== Number(id));
    saveLocalStore(memoryStore);
    return true;
  },

  // Raw Backup Export
  getCompleteBackupData() {
    return memoryStore;
  },

  restoreBackupData(data: AppStore) {
    memoryStore = data;
    saveLocalStore(memoryStore);
    return true;
  },
};
