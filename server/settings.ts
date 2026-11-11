import fs from 'fs';
import { dataFile } from './dataDir.ts';
import { AI_PROVIDERS, AiProvider, DEFAULT_MODELS } from './ai/providers.ts';

const SETTINGS_FILE = dataFile('settings.json');

interface ProviderSettings {
  api_key: string;
  model: string;
}

interface Settings {
  site_password_hash?: string; // bcrypt hash of the visitor password; unset = open site
  active_provider?: AiProvider;
  providers?: Partial<Record<AiProvider, ProviderSettings>>;
  anthropic_api_key?: string; // legacy single-key format
}

function readSettings(): Settings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  } catch (err) {
    console.error('Error reading settings:', err);
  }
  return {};
}

function writeSettings(settings: Settings): void {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), { encoding: 'utf-8', mode: 0o600 });
}

export interface ProviderConfig {
  key: string;
  model: string;
  source: 'admin' | 'env';
}

// Keys saved from the admin panel take precedence; Claude also falls back to ANTHROPIC_API_KEY in .env
export function getProviderConfig(provider: AiProvider): ProviderConfig | null {
  const settings = readSettings();
  const saved = settings.providers?.[provider];
  if (saved?.api_key) return { key: saved.api_key, model: saved.model || DEFAULT_MODELS[provider], source: 'admin' };
  if (provider === 'claude') {
    const legacy = settings.anthropic_api_key || process.env.ANTHROPIC_API_KEY;
    if (legacy) return { key: legacy, model: DEFAULT_MODELS.claude, source: settings.anthropic_api_key ? 'admin' : 'env' };
  }
  return null;
}

// The provider chosen by the admin, or the first one that has a key
export function getActiveProvider(): AiProvider | null {
  const chosen = readSettings().active_provider;
  if (chosen && getProviderConfig(chosen)) return chosen;
  return AI_PROVIDERS.find((p) => getProviderConfig(p)) ?? null;
}

export function saveProvider(provider: AiProvider, apiKey: string, model: string): void {
  const settings = readSettings();
  settings.providers = { ...settings.providers, [provider]: { api_key: apiKey, model } };
  if (provider === 'claude') delete settings.anthropic_api_key;
  if (!settings.active_provider || !getProviderConfig(settings.active_provider)) settings.active_provider = provider;
  writeSettings(settings);
}

export function removeProvider(provider: AiProvider): void {
  const settings = readSettings();
  if (settings.providers) delete settings.providers[provider];
  if (provider === 'claude') delete settings.anthropic_api_key;
  if (settings.active_provider === provider) delete settings.active_provider;
  writeSettings(settings);
}

export function setActiveProvider(provider: AiProvider): void {
  writeSettings({ ...readSettings(), active_provider: provider });
}

export function getSitePasswordHash(): string | undefined {
  return readSettings().site_password_hash;
}

export function setSitePasswordHash(hash: string): void {
  writeSettings({ ...readSettings(), site_password_hash: hash });
}

// Never send a key back to the browser; show just enough to recognize it
export function maskApiKey(key: string): string {
  return key.length > 12 ? `${key.slice(0, 7)}…${key.slice(-4)}` : '••••';
}
