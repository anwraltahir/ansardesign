import { AnnouncementFormData, Sheikh } from '../types';

// All of a sheikh's photos; the first is the main one (photo_url)
export function getSheikhPhotos(sheikh?: Partial<Sheikh> | null): string[] {
  if (!sheikh) return [];
  return [sheikh.photo_url, ...(sheikh.additional_photos || [])].filter(Boolean) as string[];
}

// The photo chosen for an announcement, falling back to the main photo
export function pickSheikhPhoto(sheikh?: Partial<Sheikh> | null, preferred?: string): string | undefined {
  const photos = getSheikhPhotos(sheikh);
  return preferred && photos.includes(preferred) ? preferred : photos[0];
}

// Sheikh objects for the poster, including names typed in by hand (ids <= 0 never clash with real ones)
export function resolvePrimarySheikh(formData: AnnouncementFormData, sheikhs: Sheikh[]): Sheikh | undefined {
  const manual = formData.manualSheikh;
  if (manual?.name.trim()) {
    return {
      id: 0,
      title: manual.title.trim(),
      full_name: manual.name.trim(),
      short_name: manual.name.trim(),
      role_description: manual.role.trim(),
      is_active: true,
    };
  }
  return sheikhs.find((s) => s.id === formData.primarySheikhId);
}

export function resolveSecondarySheikhs(formData: AnnouncementFormData, sheikhs: Sheikh[]): Sheikh[] {
  const listed = sheikhs.filter((s) => formData.secondarySheikhIds.includes(s.id));
  const manual = (formData.manualCoSheikhs || []).map((name, i) => ({
    id: -(i + 1),
    title: '',
    full_name: name,
    short_name: name,
    is_active: true,
  }));
  return [...listed, ...manual];
}
