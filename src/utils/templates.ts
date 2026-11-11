import { AnnouncementType, DesignTemplate } from '../types';

// Built-in template per type, used when the archive has no matching style yet
const DEFAULT_TEMPLATE: Partial<Record<AnnouncementType, string>> = {
  'خطبة جمعة': 'emerald-turquoise',
  'محاضرة كبرى': 'golden-heritage',
  'ملتقى دعوي': 'official-blue',
  'ندوة علمية': 'official-blue',
  'دورة علمية': 'classic-islamic',
  'برنامج دراسة المتون العلمية': 'classic-islamic',
  'جدول برامج': 'modern-geometric',
};

// Prefer the newest active style extracted from the group's own past announcements for this type
export function recommendTemplate(type: AnnouncementType, templates: DesignTemplate[]): string {
  const archiveMatch = templates
    .filter((t) => t.category === 'archive' && t.is_active && t.suits_types?.includes(type))
    .sort((a, b) => (b.source_reference_id ?? 0) - (a.source_reference_id ?? 0))[0];
  return archiveMatch?.id ?? DEFAULT_TEMPLATE[type] ?? 'golden-heritage';
}
