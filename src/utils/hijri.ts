// Accurate Hijri calendar estimation and Arabic date formatting utilities

export const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

export const HIJRI_MONTHS = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

// Parse "YYYY-MM-DD" as a local date (new Date('YYYY-MM-DD') is UTC and can shift the day)
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = (dateString || '').split('-').map(Number);
  if (!year || !month || !day) return new Date(NaN);
  return new Date(year, month - 1, day);
}

export function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Upcoming Friday (next week's if today is Friday) as "YYYY-MM-DD"
export function getNextFridayISO(): string {
  const d = new Date();
  const diff = (5 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return toLocalISODate(d);
}

// Today (if Friday) and the following Fridays, as "YYYY-MM-DD"
export function getUpcomingFridays(count: number): string[] {
  const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7));
  return Array.from({ length: count }, (_, i) => {
    const friday = new Date(d);
    friday.setDate(d.getDate() + i * 7);
    return toLocalISODate(friday);
  });
}

export function getArabicDayName(dateString: string): string {
  if (!dateString) return '';
  const date = parseLocalDate(dateString);
  if (isNaN(date.getTime())) return '';
  return ARABIC_DAYS[date.getDay()];
}

export function isFriday(dateString: string): boolean {
  if (!dateString) return false;
  const date = parseLocalDate(dateString);
  if (isNaN(date.getTime())) return false;
  return date.getDay() === 5; // Friday is 5
}

export function formatGregorianArabic(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return dateString;
  const monthName = ARABIC_MONTHS[month - 1];
  return `${day} ${monthName} ${year}م`;
}

// Convert Gregorian to Hijri approximate date
export function toHijriDate(dateString: string): string {
  if (!dateString) return '';
  const date = parseLocalDate(dateString);
  if (isNaN(date.getTime())) return '';

  // Use Intl if supported by environment
  try {
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return formatter.format(date);
  } catch (e) {
    // Fallback algorithmic calculation
    const jd = Math.floor(date.getTime() / 86400000) + 2440587.5;
    const l = Math.floor(jd - 1948440 + 10632);
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
    const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const m = Math.floor((24 * l3) / 709);
    const d = l3 - Math.floor((709 * m) / 24);
    const y = 30 * n + j - 30;
    return `${d} ${HIJRI_MONTHS[m - 1] || 'هـ'} ${y}هـ`;
  }
}
