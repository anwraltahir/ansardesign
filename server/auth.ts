import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'ansar-al-sunna-secret-key-2026-dawah-secure-token';
const ADMIN_CREDENTIALS_FILE = path.join(process.cwd(), 'uploads', 'admin_credentials.json');

interface AdminUser {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
}

// Load or seed default admin safely
function getAdminCredentials(): AdminUser {
  try {
    if (fs.existsSync(ADMIN_CREDENTIALS_FILE)) {
      const data = fs.readFileSync(ADMIN_CREDENTIALS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading admin credentials:', err);
  }

  // Default initial admin (can be updated by admin anytime in dashboard)
  const defaultSalt = bcrypt.genSaltSync(10);
  const defaultHash = bcrypt.hashSync('ansar@2026', defaultSalt);

  const initialAdmin: AdminUser = {
    id: 1,
    username: 'admin',
    email: 'admin@ansaralsuna.net',
    passwordHash: defaultHash,
    fullName: 'مدير أمانة الدعوة',
    role: 'superadmin',
  };

  try {
    fs.writeFileSync(ADMIN_CREDENTIALS_FILE, JSON.stringify(initialAdmin, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error initializing admin credentials file:', e);
  }

  return initialAdmin;
}

let currentAdmin = getAdminCredentials();

export function verifyAdminPassword(password: string): boolean {
  return bcrypt.compareSync(password, currentAdmin.passwordHash);
}

export function generateToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function updateAdminPassword(newPassword: string): void {
  const salt = bcrypt.genSaltSync(10);
  currentAdmin.passwordHash = bcrypt.hashSync(newPassword, salt);
  fs.writeFileSync(ADMIN_CREDENTIALS_FILE, JSON.stringify(currentAdmin, null, 2), 'utf-8');
}

export function updateAdminProfile(fullName: string, email: string): void {
  currentAdmin.fullName = fullName;
  currentAdmin.email = email;
  fs.writeFileSync(ADMIN_CREDENTIALS_FILE, JSON.stringify(currentAdmin, null, 2), 'utf-8');
}

export function getAdminPublicInfo() {
  return {
    id: currentAdmin.id,
    username: currentAdmin.username,
    email: currentAdmin.email,
    fullName: currentAdmin.fullName,
    role: currentAdmin.role,
  };
}

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح: يجب تسجيل الدخول للوصول إلى لوحة الإدارة' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'انتهت صلاحية الجلسة أو الرمز غير صالح' });
  }
}
