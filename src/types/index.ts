export type AnnouncementType =
  | 'خطبة جمعة'
  | 'محاضرة كبرى'
  | 'محاضرة عامة'
  | 'برنامج دعوي'
  | 'دورة علمية'
  | 'برنامج دراسة المتون العلمية'
  | 'ندوة علمية'
  | 'ملتقى دعوي'
  | 'جدول برامج'
  | 'إعلان آخر';

export type TimeType =
  | 'بعد صلاة الفجر'
  | 'بعد صلاة الظهر'
  | 'بعد صلاة العصر'
  | 'بعد صلاة المغرب'
  | 'بعد صلاة العشاء'
  | 'بعد صلاة الجمعة'
  | 'وقت صلاة الجمعة'
  | 'وقت محدد';

export interface Sheikh {
  id: number;
  full_name: string;
  short_name: string;
  title: string;
  role_description?: string;
  calligraphy_url?: string;
  photo_url?: string;
  additional_photos?: string[];
  bio?: string;
  is_active: boolean;
}

export interface Mosque {
  id: number;
  name: string;
  state_id: number;
  locality_id: number;
  area_neighborhood?: string;
  address_details?: string;
  main_photo_url?: string;
  additional_photos?: string[];
  is_active: boolean;
}

export interface State {
  id: number;
  name: string;
  code?: string;
  is_active: boolean;
}

export interface Locality {
  id: number;
  state_id: number;
  name: string;
  is_active: boolean;
}

export interface VisualIdentity {
  group_logo_url?: string;
  dawah_header_text: string;
  dawah_header_subtext: string;
  website_url: string;
  official_site?: string;
  facebook_handle: string;
  youtube_handle: string;
  telegram_handle: string;
  contact_phone: string;
}

// Visual style extracted by AI from a past announcement (see server/ai/styleAnalysis.ts)
export interface PosterStyle {
  name: string;
  description: string;
  suits_types: AnnouncementType[];
  palette: {
    background_top: string;
    background_middle: string;
    background_bottom: string;
    accent: string;
    title: string;
    text: string;
    muted: string;
    card_background: string;
    card_border: string;
  };
  title_font: 'amiri' | 'kufi' | 'cairo' | 'tajawal';
  ornament: 'islamic-stars' | 'geometric-lattice' | 'mosque-skyline' | 'minimal';
  corner_ornaments: boolean;
  card_style: 'glass' | 'solid' | 'outlined';
  mood_notes: string;
}

export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  category: string; // 'archive' for templates generated from past announcements
  is_active: boolean;
  source_reference_id?: number;
  suits_types?: AnnouncementType[];
  style?: PosterStyle;
}

export interface StyleReference {
  id: number;
  image_url: string;
  announcement_type: string;
  notes: string;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  style: PosterStyle | null;
  error: string;
  created_at: string;
}

export interface MultiSession {
  id: string;
  day: string;
  date: string;
  time: string;
  sheikhName?: string;
  topic?: string;
  location?: string;
}

export interface AnnouncementFormData {
  id?: number;
  type: AnnouncementType;
  title: string;
  subtitle?: string;
  primarySheikhId: number | null;
  sheikhPhotoUrl?: string; // which of the sheikh's photos to show on the poster
  // Sheikhs typed in by hand for this announcement only (not in the approved list)
  manualSheikh?: { title: string; name: string; role: string };
  manualCoSheikhs?: string[];
  secondarySheikhIds: number[];
  stateId: number | null;
  localityId: number | null;
  mosqueId: number | null;
  customLocation?: string;
  date: string; // YYYY-MM-DD
  dayName: string;
  hijriDate?: string;
  timeType: TimeType;
  customTimeHour?: string;
  customTimeMinute?: string;
  customTimePeriod?: 'ص' | 'م';
  topic?: string;
  courseName?: string;
  booksAndTexts?: string;
  symposiumThemes?: string;
  participantNames?: string;
  specialNotes?: string;
  liveBroadcast?: boolean;
  womenHallAvailable?: boolean;
  multiSessions: MultiSession[];
  templateId: string;
}
