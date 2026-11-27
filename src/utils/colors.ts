// Subject-coded functional accent colors tuned for Warm Editorial Paper contrast
// Chemistry: Editorial Crimson (#DC2626)
// Physics: Cobalt Blue (#2563EB)
// Combined Maths / Mathematics: Deep Emerald (#059669)
export const SUBJECT_ACCENT_COLORS = [
  '#DC2626', // 0: Crimson (Chemistry)
  '#2563EB', // 1: Cobalt Blue (Physics)
  '#059669', // 2: Deep Emerald (Combined Maths / Biology)
  '#D97706', // 3: Warm Amber
  '#7C3AED', // 4: Violet
  '#0891B2', // 5: Teal Cyan
  '#EA580C', // 6: Deep Orange
  '#4F46E5', // 7: Indigo
];

export function getSubjectAccentColor(index: number): string {
  return SUBJECT_ACCENT_COLORS[Math.abs(index) % SUBJECT_ACCENT_COLORS.length];
}

/**
 * Returns a consistent accent color for a subject by its name or ID.
 * Standardizes:
 * - Chemistry -> Crimson (#DC2626)
 * - Physics -> Cobalt Blue (#2563EB)
 * - Combined Maths / Mathematics / Maths -> Deep Emerald (#059669)
 * - Other subjects map deterministically to the color palette based on their order
 */
export function getSubjectColorById(
  subjectId: string,
  allSubjects: { id: string; name?: string }[]
): string {
  const subj = allSubjects.find((s) => s.id === subjectId);
  if (subj && subj.name) {
    const lower = subj.name.toLowerCase().trim();
    if (lower.includes('chem')) {
      return '#DC2626';
    }
    if (lower.includes('phys')) {
      return '#2563EB';
    }
    if (lower.includes('math') || lower.includes('combined')) {
      return '#059669';
    }
  }

  const idx = allSubjects.findIndex((s) => s.id === subjectId);
  return getSubjectAccentColor(idx >= 0 ? idx : 0);
}

export interface SoftColorPalette {
  bg: string;
  border: string;
  accent: string;
}

// Soft, muted editorial pastel palettes for Today timeline cards & accents
export const SOFT_COLOR_PALETTES: SoftColorPalette[] = [
  { bg: '#FAF0EF', border: '#EAD3D0', accent: '#B45A55' }, // 0: Dusty Rose (Chemistry)
  { bg: '#EFF4FA', border: '#D3DFEE', accent: '#4A73A8' }, // 1: Slate Sky Blue (Physics)
  { bg: '#EEF6F2', border: '#CFE3D8', accent: '#3D7F63' }, // 2: Sage Green (Combined Maths)
  { bg: '#FAF5EB', border: '#E8DABF', accent: '#9A6B2F' }, // 3: Soft Sand Ochre
  { bg: '#F3F1F8', border: '#DDD7EA', accent: '#6F6296' }, // 4: Soft Lavender
  { bg: '#EDF6F7', border: '#CDE3E6', accent: '#3F7D8C' }, // 5: Mist Teal
  { bg: '#FAF2EC', border: '#EBD6C7', accent: '#B0643C' }, // 6: Soft Peach Clay
  { bg: '#F0F1FA', border: '#D5D8EE', accent: '#5A5CA6' }, // 7: Soft Periwinkle
];

export const SOFT_NEUTRAL_STONE_PALETTE: SoftColorPalette = {
  bg: '#F4F1EA',
  border: '#E2DDD3',
  accent: '#6D675E',
};

export function getSoftSubjectPaletteById(
  subjectId: string,
  allSubjects: { id: string; name?: string }[]
): SoftColorPalette {
  const subj = allSubjects.find((s) => s.id === subjectId);
  if (subj && subj.name) {
    const lower = subj.name.toLowerCase().trim();
    if (lower.includes('chem')) {
      return SOFT_COLOR_PALETTES[0];
    }
    if (lower.includes('phys')) {
      return SOFT_COLOR_PALETTES[1];
    }
    if (lower.includes('math') || lower.includes('combined')) {
      return SOFT_COLOR_PALETTES[2];
    }
  }

  const idx = allSubjects.findIndex((s) => s.id === subjectId);
  return SOFT_COLOR_PALETTES[Math.abs(idx >= 0 ? idx : 0) % SOFT_COLOR_PALETTES.length];
}

export function getSoftCategoryPalette(category?: string): SoftColorPalette {
  const normalized = (category || '').toLowerCase().trim();
  if (normalized.includes('past paper')) return SOFT_COLOR_PALETTES[0];
  if (normalized.includes('revision')) return SOFT_COLOR_PALETTES[3];
  if (normalized.includes('tuition')) return SOFT_COLOR_PALETTES[4];
  if (normalized.includes('notes')) return SOFT_COLOR_PALETTES[5];
  return SOFT_NEUTRAL_STONE_PALETTE;
}
