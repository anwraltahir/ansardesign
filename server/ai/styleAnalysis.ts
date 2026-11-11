import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod/v4';

// Announcement types the poster engine knows; the model may only pick from these
export const ANNOUNCEMENT_TYPES = [
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
] as const;

const hex = z.string().describe('Hex color, #RRGGBB or #RRGGBBAA');

export const PosterStyleSchema = z.object({
  name: z.string().describe('Short Arabic name for the style, 2-4 words'),
  description: z.string().describe('One Arabic sentence describing the look'),
  suits_types: z.array(z.enum(ANNOUNCEMENT_TYPES)),
  palette: z.object({
    background_top: hex,
    background_middle: hex,
    background_bottom: hex,
    accent: hex,
    title: hex,
    text: hex,
    muted: hex,
    card_background: hex,
    card_border: hex,
  }),
  title_font: z.enum(['amiri', 'kufi', 'cairo', 'tajawal']),
  ornament: z.enum(['islamic-stars', 'geometric-lattice', 'mosque-skyline', 'minimal']),
  corner_ornaments: z.boolean(),
  card_style: z.enum(['glass', 'solid', 'outlined']),
  mood_notes: z.string().describe('1-3 sentences on what the fields above do not capture'),
});

export type PosterStyle = z.infer<typeof PosterStyleSchema>;

export class StyleAnalysisError extends Error {}

const MODEL = 'claude-opus-5-5';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MEDIA_TYPES: Record<string, 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export function isAiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

// The system prompt carries the archive's existing styles so new ones stay in the same family
function buildSystemPrompt(archiveStyles: PosterStyle[]): string {
  const archive = archiveStyles.length
    ? archiveStyles
        .map((s) =>
          JSON.stringify({ name: s.name, suits_types: s.suits_types, palette: s.palette, title_font: s.title_font, ornament: s.ornament, mood_notes: s.mood_notes })
        )
        .join('\n')
    : '(The archive has no analyzed styles yet; this design sets the baseline.)';

  return `You are the design-system analyst for «المصمم الذكي», the announcement designer of أمانة الدعوة at جماعة أنصار السنة المحمدية بالسودان. Admins upload announcements the group has published in the past. Your job is to study one of them and describe its visual style as a reusable style spec, so that announcements the system generates from now on look like members of the same family as the group's archive.

How the spec is used: the system renders every poster with a fixed layout — a header with the group's emblem and the Bismillah, an announcement-type badge, a large title, a card with the sheikh's round photo and name, three info cards (place, date, time), and a footer with the group's accounts. The spec controls only the look of that layout: the background gradient (top, middle, bottom), the accent color (ornaments, labels, icons, frame), the title color, body and muted text colors, the info-card background and border, the title font, the background ornament, whether corner ornaments appear, and the card style. The system writes all text itself, so never transcribe the design's text into the spec or invent content.

Guidance:
- Sample colors from the design itself as hex. Keep the original's character: a dark design stays dark, a light design stays light.
- Readability matters more than fidelity: title and text must have at least 4.5:1 contrast against background_middle and card_background. If the original falls short, adjust lightness while keeping the hue.
- card_background may be translucent; write it as #RRGGBBAA.
- title_font: amiri for naskh or calligraphic titles, kufi for geometric kufic lettering, cairo for bold modern sans, tajawal for light modern sans.
- ornament: islamic-stars for scattered star motifs, geometric-lattice for interlaced geometric patterns, mosque-skyline for domes and minarets, minimal when the background is plain.
- suits_types: choose from the allowed list the announcement types this style fits — the type the admin tagged, plus any others whose tone matches.
- name: a short Arabic name describing the look (for example «الأخضر التراثي»); description: one Arabic sentence.
- mood_notes: one to three sentences on what the fields cannot express (framing, photography, density), kept for future reference.

Consistency with the archive: the styles below were already extracted from this group's archive. Keep the family coherent — when this design uses the same brand colors as an existing style, reuse those exact hex values instead of near-duplicates, and give this style a name distinct from the existing names.

${archive}`;
}

// Resolve an /uploads/references/... URL to a file on disk, refusing anything outside that folder
function resolveReferenceImage(imageUrl: string): { data: string; mediaType: (typeof MEDIA_TYPES)[string] } {
  const match = /^\/uploads\/references\/([\w.-]+)$/.exec(imageUrl);
  if (!match) throw new StyleAnalysisError('مسار الصورة المرجعية غير صالح');
  const filePath = path.join(process.cwd(), 'uploads', 'references', match[1]);
  const mediaType = MEDIA_TYPES[path.extname(filePath).toLowerCase()];
  if (!mediaType) throw new StyleAnalysisError('صيغة الصورة غير مدعومة للتحليل. استخدم PNG أو JPG أو WebP.');
  const buffer = fs.readFileSync(filePath);
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new StyleAnalysisError('حجم الصورة أكبر من 5 ميجابايت. صغّرها ثم أعد رفعها.');
  }
  return { data: buffer.toString('base64'), mediaType };
}

export async function analyzeReferenceStyle(params: {
  imageUrl: string;
  announcementType?: string;
  notes?: string;
  archiveStyles: PosterStyle[];
}): Promise<PosterStyle> {
  if (!isAiEnabled()) {
    throw new StyleAnalysisError('الذكاء الاصطناعي غير مفعّل: أضف ANTHROPIC_API_KEY إلى ملف .env ثم أعد تشغيل الخدمة.');
  }

  const image = resolveReferenceImage(params.imageUrl);
  const context = [
    params.announcementType ? `Announcement type tagged by the admin: ${params.announcementType}` : 'The admin did not tag an announcement type.',
    params.notes ? `Admin notes: ${params.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high', format: betaZodOutputFormat(PosterStyleSchema) },
    system: buildSystemPrompt(params.archiveStyles),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.data } },
          { type: 'text', text: `${context}\n\nExtract the style spec for this announcement.` },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new StyleAnalysisError('اعتذر النموذج عن تحليل هذه الصورة.');
  }
  if (!response.parsed_output) {
    throw new StyleAnalysisError('لم يُرجع النموذج وصفاً صالحاً للأسلوب. حاول مرة أخرى.');
  }
  return sanitizeStyle(response.parsed_output);
}

// Guard the renderer against malformed colors: anything that isn't hex falls back to a safe default
const SAFE_DEFAULTS: PosterStyle['palette'] = {
  background_top: '#0c2a20',
  background_middle: '#081d16',
  background_bottom: '#040e0b',
  accent: '#fbbf24',
  title: '#fef3c7',
  text: '#e2e8f0',
  muted: '#94a3b8',
  card_background: '#0f172acc',
  card_border: '#fbbf2440',
};

function sanitizeStyle(style: PosterStyle): PosterStyle {
  const palette = { ...style.palette };
  for (const key of Object.keys(palette) as (keyof PosterStyle['palette'])[]) {
    if (!/^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(palette[key])) palette[key] = SAFE_DEFAULTS[key];
  }
  return { ...style, palette };
}
