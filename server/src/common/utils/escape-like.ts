// Without this, a user typing "%" into the search box would ILIKE-match
// every row instead of literally none — see ImplementationPlan.md §5.
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
