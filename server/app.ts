import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { db, UPLOAD_DIRS } from './db.ts';
import {
  requireAdminAuth,
  verifyAdminPassword,
  generateToken,
  getAdminPublicInfo,
  updateAdminPassword,
  updateAdminProfile,
  AuthenticatedRequest,
} from './auth.ts';
import { analyzeReferenceStyle, isAiEnabled, StyleAnalysisError } from './ai/styleAnalysis.ts';

export const app = express();

// Standard middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.query.category as string;
    let targetDir = UPLOAD_DIRS.designs;
    if (category === 'sheikhs' || category === 'sheikh') targetDir = UPLOAD_DIRS.sheikhs;
    else if (category === 'calligraphy') targetDir = UPLOAD_DIRS.calligraphy;
    else if (category === 'mosques' || category === 'mosque') targetDir = UPLOAD_DIRS.mosques;
    else if (category === 'logos' || category === 'logo') targetDir = UPLOAD_DIRS.logos;
    else if (category === 'backgrounds' || category === 'background') targetDir = UPLOAD_DIRS.backgrounds;
    else if (category === 'references') targetDir = UPLOAD_DIRS.references;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|svg/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext) || file.mimetype.includes('image')) {
      cb(null, true);
    } else {
      cb(new Error('صيغة الملف غير مدعومة. يرجى رفع صور بصيغة PNG أو JPG أو WebP أو SVG.'));
    }
  },
});

// ==========================================
// 1. Authentication Routes
// ==========================================

// Admin Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const admin = getAdminPublicInfo();

    if (username !== admin.username || !verifyAdminPassword(password)) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const token = generateToken({ id: admin.id, username: admin.username, role: admin.role });
    return res.json({
      success: true,
      token,
      admin,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Verify Current Admin
app.get('/api/auth/me', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, admin: getAdminPublicInfo() });
});

// Change Password
app.post('/api/auth/change-password', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!verifyAdminPassword(currentPassword)) {
      return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف' });
    }
    updateAdminPassword(newPassword);
    return res.json({ success: true, message: 'تم تحديث كلمة المرور بنجاح' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update Profile
app.post('/api/auth/update-profile', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fullName, email } = req.body;
    if (!fullName || !email) {
      return res.status(400).json({ error: 'الاسم والبريد الإلكتروني مطلوبان' });
    }
    updateAdminProfile(fullName, email);
    return res.json({ success: true, admin: getAdminPublicInfo() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. Sheikhs Routes (Public Read, Admin Write)
// ==========================================

app.get('/api/sheikhs', async (req: Request, res: Response) => {
  try {
    const sheikhs = await db.getSheikhs();
    return res.json(sheikhs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/sheikhs', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { full_name, short_name, title, role_description, photo_url, additional_photos, calligraphy_url, bio, is_active } = req.body;
    if (!full_name || !short_name) {
      return res.status(400).json({ error: 'الاسم الكامل والاسم المختصر مطلوبان' });
    }
    const saved = await db.saveSheikh({
      full_name,
      short_name,
      title: title || '',
      role_description: role_description || '',
      photo_url: photo_url || '',
      additional_photos: Array.isArray(additional_photos) ? additional_photos : [],
      calligraphy_url: calligraphy_url || '',
      bio: bio || '',
      is_active: is_active ?? true,
    });
    return res.json({ success: true, sheikh: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/sheikhs/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const saved = await db.saveSheikh({ ...req.body, id });
    return res.json({ success: true, sheikh: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sheikhs/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.deleteSheikh(id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. Mosques Routes (Public Read, Admin Write)
// ==========================================

app.get('/api/mosques', async (req: Request, res: Response) => {
  try {
    const state_id = req.query.state_id ? parseInt(req.query.state_id as string, 10) : undefined;
    const locality_id = req.query.locality_id ? parseInt(req.query.locality_id as string, 10) : undefined;
    const mosques = await db.getMosques({ state_id, locality_id });
    return res.json(mosques);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/mosques', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, state_id, locality_id, area_neighborhood, address_details, main_photo_url, additional_photos } = req.body;
    if (!name || !state_id || !locality_id) {
      return res.status(400).json({ error: 'اسم المسجد والولاية والمحلية مطلوبة' });
    }
    const saved = await db.saveMosque({
      name,
      state_id: Number(state_id),
      locality_id: Number(locality_id),
      area_neighborhood: area_neighborhood || '',
      address_details: address_details || '',
      main_photo_url: main_photo_url || '',
      additional_photos: additional_photos || [],
      is_active: true,
    });
    return res.json({ success: true, mosque: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/mosques/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const saved = await db.saveMosque({ ...req.body, id });
    return res.json({ success: true, mosque: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/mosques/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.deleteMosque(id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. Locations Routes (States & Localities)
// ==========================================

app.get('/api/states', async (req: Request, res: Response) => {
  try {
    const states = await db.getStates();
    return res.json(states);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/states', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, code } = req.body;
    if (!name) return res.status(400).json({ error: 'اسم الولاية مطلوب' });
    const saved = await db.saveState({ name, code: code || '' });
    return res.json({ success: true, state: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/states/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.deleteState(id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/localities', async (req: Request, res: Response) => {
  try {
    const state_id = req.query.state_id ? parseInt(req.query.state_id as string, 10) : undefined;
    const localities = await db.getLocalities(state_id);
    return res.json(localities);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/localities', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, state_id } = req.body;
    if (!name || !state_id) return res.status(400).json({ error: 'اسم المحلية والولاية مطلوبان' });
    const saved = await db.saveLocality({ name, state_id: Number(state_id) });
    return res.json({ success: true, locality: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/localities/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.deleteLocality(id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. Visual Identity & Templates
// ==========================================

app.get('/api/identity', async (req: Request, res: Response) => {
  try {
    const identity = await db.getVisualIdentity();
    return res.json(identity);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/identity', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await db.updateVisualIdentity(req.body);
    return res.json({ success: true, identity: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/templates', async (req: Request, res: Response) => {
  try {
    const templates = await db.getTemplates();
    return res.json(templates);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/templates/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    const updated = await db.updateTemplate(id, req.body);
    return res.json({ success: true, template: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. File Upload Handling
// ==========================================

app.post('/api/upload', requireAdminAuth, upload.single('file'), (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم استلام أي ملف' });
    }
    const category = (req.query.category as string) || 'designs';
    const relativePath = `/uploads/${category}/${req.file.filename}`;
    return res.json({
      success: true,
      url: relativePath,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6b. Style References (past announcements) & AI style analysis
// ==========================================

app.get('/api/ai/status', (req: Request, res: Response) => {
  return res.json({ enabled: isAiEnabled() });
});

app.get('/api/style-references', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    return res.json(await db.getStyleReferences());
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/style-references', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { image_url, announcement_type, notes } = req.body;
    if (!image_url || !/^\/uploads\/references\/[\w.-]+$/.test(image_url)) {
      return res.status(400).json({ error: 'يجب رفع صورة الإعلان المرجعي أولاً' });
    }
    return res.json(await db.createStyleReference({ image_url, announcement_type, notes }));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/style-references/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.deleteStyleReference(parseInt(req.params.id, 10));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/style-references/:id/analyze', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const refs = await db.getStyleReferences();
  const reference = refs.find((r) => r.id === id);
  if (!reference) return res.status(404).json({ error: 'الإعلان المرجعي غير موجود' });

  try {
    await db.updateStyleReference(id, { status: 'analyzing', error: '' });
    const archiveStyles = refs.filter((r) => r.id !== id && r.status === 'done' && r.style).map((r) => r.style);
    const style = await analyzeReferenceStyle({
      imageUrl: reference.image_url,
      announcementType: reference.announcement_type,
      notes: reference.notes,
      archiveStyles,
    });
    const template = await db.upsertArchiveTemplate(id, style);
    const updated = await db.updateStyleReference(id, { status: 'done', style, error: '' });
    return res.json({ reference: updated, template });
  } catch (err: any) {
    const message = err instanceof StyleAnalysisError ? err.message : `تعذر تحليل التصميم: ${err.message}`;
    console.error('Style analysis failed:', err);
    await db.updateStyleReference(id, { status: 'error', error: message });
    return res.status(err instanceof StyleAnalysisError ? 400 : 502).json({ error: message });
  }
});

// ==========================================
// 7. Announcements / Saved Designs
// ==========================================

app.get('/api/announcements', async (req: Request, res: Response) => {
  try {
    const announcements = await db.getAnnouncements();
    return res.json(announcements);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/announcements/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await db.getAnnouncementById(id);
    if (!item) return res.status(404).json({ error: 'الإعلان غير موجود' });
    return res.json(item);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/announcements', async (req: Request, res: Response) => {
  try {
    const saved = await db.saveAnnouncement(req.body);
    return res.json({ success: true, announcement: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/announcements/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.deleteAnnouncement(id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. System Status, Database and Backups
// ==========================================

app.get('/api/system/status', (req: Request, res: Response) => {
  const isPg = db.isPostgresConnected();
  const pgReason = db.getPostgresErrorReason();
  return res.json({
    status: 'online',
    version: '2.0.0',
    platform: 'منصة المصمم الذكي - أمانة الدعوة',
    domain: 'design.ansaralsuna.net',
    database: {
      engine: isPg ? 'PostgreSQL (متصل)' : 'Local Persistent Engine (نشط)',
      isPostgresActive: isPg,
      info: isPg ? 'قاعدة البيانات متصلة بنجاح عبر PostgreSQL' : pgReason,
    },
    uptime: process.uptime(),
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
  });
});

app.get('/api/system/backup', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const fullBackup = db.getCompleteBackupData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=ansar_design_backup_${Date.now()}.json`);
    return res.send(JSON.stringify(fullBackup, null, 2));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/system/restore', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    if (!data.sheikhs || !data.mosques) {
      return res.status(400).json({ error: 'ملف النسخة الاحتياطية غير صالح' });
    }
    db.restoreBackupData(data);
    return res.json({ success: true, message: 'تم استعادة النسخة الاحتياطية بنجاح' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
