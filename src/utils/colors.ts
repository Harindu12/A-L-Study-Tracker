// Subject-coded functional accent colors for left-edge card stripes
// Matching the red, blue, amber, emerald, violet, cyan category tags in the reference UI
// Chemistry: Red (#EF4444)
// Physics: Blue (#3B82F6)
// Combined Maths / Mathematics: Emerald/Green (#10B981)
export const SUBJECT_ACCENT_COLORS = [
  '#EF4444', // 0: Red / Rose (Chemistry)
  '#3B82F6', // 1: Blue (Physics)
  '#10B981', // 2: Emerald / Green (Combined Maths / Biology)
  '#F59E0B', // 3: Amber
  '#8B5CF6', // 4: Purple / Violet
  '#06B6D4', // 5: Cyan
  '#F97316', // 6: Orange
  '#6366F1', // 7: Indigo
];

export function getSubjectAccentColor(index: number): string {
  return SUBJECT_ACCENT_COLORS[Math.abs(index) % SUBJECT_ACCENT_COLORS.length];
}

/**
 * Returns a consistent accent color for a subject by its name or ID.
 * Standardizes:
 * - Chemistry -> Red (#EF4444)
 * - Physics -> Blue (#3B82F6)
 * - Combined Maths / Mathematics / Maths -> Emerald/Green (#10B981)
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
      return '#EF4444'; // Red
    }
    if (lower.includes('phys')) {
      return '#3B82F6'; // Blue
    }
    if (lower.includes('math') || lower.includes('combined')) {
      return '#10B981'; // Emerald
    }
  }

  const idx = allSubjects.findIndex((s) => s.id === subjectId);
  return getSubjectAccentColor(idx >= 0 ? idx : 0);
}
