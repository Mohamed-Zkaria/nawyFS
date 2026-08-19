type ClassValue = string | number | null | undefined | false;

// No clsx/tailwind-merge dependency — a one-line join covers every case in
// this codebase (KISS, matches the "don't build a design system" rule).
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
