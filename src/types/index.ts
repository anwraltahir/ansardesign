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

export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
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
