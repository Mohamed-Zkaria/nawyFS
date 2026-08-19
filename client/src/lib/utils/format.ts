const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 0,
});

export function formatPrice(price: string): string {
  return priceFormatter.format(Number(price));
}

export function formatArea(areaSqm: string): string {
  return `${Number(areaSqm).toLocaleString()} m²`;
}
