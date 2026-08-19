// Strips keys whose value is `undefined` (keeps `null`) so a partial PATCH
// payload can be merged onto an entity with Object.assign without an
// unset field silently clobbering an existing column value.
export function withoutUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
