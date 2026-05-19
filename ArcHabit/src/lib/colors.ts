export const HABIT_COLORS = [
  "#E07A5F", // Terracotta
  "#F2CC8F", // Muted Sand
  "#81B29A", // Sage Green
  "#3D405B", // Deep Slate
  "#6B9080", // Forest Green
  "#A3B18A", // Mint
  "#E8AC65", // Warm Ochre
  "#D99271", // Coral
  "#9A8C98", // Dusty Mauve
  "#C9ADA7"  // Soft Rose
];

export function getNextHabitColor(existingColors: string[]): string {
  const available = HABIT_COLORS.filter(c => !existingColors.includes(c));
  if (available.length > 0) return available[0];
  // fallback if somehow all are used
  return HABIT_COLORS[existingColors.length % HABIT_COLORS.length];
}
