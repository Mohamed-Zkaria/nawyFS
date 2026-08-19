// Apartment images are admin-supplied external URLs (no upload pipeline —
// see server/src/modules/apartments/dto/add-apartment-images.dto.ts), so
// their hostnames are unknowable at build time and can never satisfy
// next/image's frozen `images.remotePatterns` allowlist. `unoptimized`
// skips next/image's server-side fetch-and-transform pipeline for exactly
// these URLs, rendering a plain <img> instead — the local placeholder
// still gets full optimization.
export function isExternalUrl(src: string): boolean {
  return src.startsWith('http://') || src.startsWith('https://');
}
