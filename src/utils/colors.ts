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
