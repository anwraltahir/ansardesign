import { AnnouncementType, DesignTemplate, PosterStyle } from '../types';

// Brand style used until the archive has an analyzed announcement of the same type
export const DEFAULT_POSTER_STYLE: PosterStyle = {
  name: 'هوية أمانة الدعوة',
  description: 'الأزرق الكحلي الرسمي مع زخرفة هندسية خفيفة',
  suits_types: [],
  palette: {
    background_top: '#1f3561',
    background_middle: '#142241',
    background_bottom: '#0b1630',
    accent: '#8db8e3',
    title: '#ffffff',
    text: '#dbe8f6',
    muted: '#9fb6d6',
    card_background: '#ffffff12',
    card_border: '#8db8e340',
  },
  title_font: 'cairo',
  ornament: 'geometric-lattice',
  corner_ornaments: true,
  card_style: 'glass',
  mood_notes: '',
};

// The newest active style extracted from the group's past announcements of this type, or '' for the default
export function recommendTemplate(type: AnnouncementType, templates: DesignTemplate[]): string {
  const archiveMatch = templates
    .filter((t) => t.category === 'archive' && t.is_active && t.suits_types?.includes(type))
    .sort((a, b) => (b.source_reference_id ?? 0) - (a.source_reference_id ?? 0))[0];
  return archiveMatch?.id ?? '';
}
