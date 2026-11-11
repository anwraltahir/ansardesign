import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JWT_SECRET } from './auth.ts';
import { getSitePasswordHash, setSitePasswordHash } from './settings.ts';

// Site-wide password: every visitor must enter it before the API serves any data.
// Unset password = open site. The hash lives in data/settings.json, never in the code.

const COOKIE = 'site_access';
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

// Ties a session to the current password, so changing it signs everyone out
const passwordVersion = (hash: string) => hash.slice(-12);

function readCookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return undefined;
}

export function isSiteProtected(): boolean {
  return Boolean(getSitePasswordHash());
}

export function hasSiteAccess(req: Request): boolean {
  const hash = getSitePasswordHash();
  if (!hash) return true;
  const token = readCookie(req, COOKIE);
  if (!token) return false;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { v?: string };
    return payload.v === passwordVersion(hash);
  } catch {
    return false;
  }
}

function setAccessCookie(res: Response, hash: string) {
  const token = jwt.sign({ v: passwordVersion(hash) }, JWT_SECRET, { expiresIn: MAX_AGE_SECONDS });
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${encodeURIComponent(token)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`
  );
}

// Simple brute-force brake: 10 wrong attempts per IP per 15 minutes
const attempts = new Map<string, { count: number; resetAt: number }>();
function tooManyAttempts(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) return false;
  return entry.count >= 10;
}
function recordFailure(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
  else entry.count++;
}

export function siteLogin(req: Request, res: Response) {
  const hash = getSitePasswordHash();
  if (!hash) return res.json({ success: true });
  const ip = req.ip || 'unknown';
  if (tooManyAttempts(ip)) {
    return res.status(429).json({ error: 'محاولات كثيرة خاطئة. حاول مرة أخرى بعد ربع ساعة.' });
  }
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!bcrypt.compareSync(password, hash)) {
    recordFailure(ip);
    return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
  }
  attempts.delete(ip);
  setAccessCookie(res, hash);
  return res.json({ success: true });
}

// Admins change the password; the admin's own browser stays signed in with the new one
export function changeSitePassword(req: Request, res: Response) {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (password.length < 4) return res.status(400).json({ error: 'كلمة مرور الموقع يجب ألا تقل عن 4 أحرف' });
  const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  setSitePasswordHash(hash);
  setAccessCookie(res, hash);
  return res.json({ success: true });
}

// Guards every API route except the site login itself
export function requireSiteAccess(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/site/') || hasSiteAccess(req)) return next();
  return res.status(401).json({ error: 'أدخل كلمة مرور الموقع أولاً', code: 'site_locked' });
}
