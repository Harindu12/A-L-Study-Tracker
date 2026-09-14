// Subject-coded functional accent colors for left-edge card stripes
// Matching the red, blue, amber, emerald, violet, cyan category tags in the reference UI
export const SUBJECT_ACCENT_COLORS = [
  '#EF4444', // Red / Rose
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#8B5CF6', // Purple / Violet
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
];

export function getSubjectAccentColor(index: number): string {
  return SUBJECT_ACCENT_COLORS[Math.abs(index) % SUBJECT_ACCENT_COLORS.length];
}

export function getSubjectColorById(subjectId: string, allSubjects: { id: string }[]): string {
  const idx = allSubjects.findIndex((s) => s.id === subjectId);
  return getSubjectAccentColor(idx >= 0 ? idx : 0);
}
