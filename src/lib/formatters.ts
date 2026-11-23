/**
 * Format currency to Indonesian Rupiah (Rp)
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to local Indonesian string
 */
export function formatTanggal(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

/**
 * Format product weight to readable string
 */
export function formatBerat(gram: number): string {
  if (gram >= 1000) {
    const kg = (gram / 1000).toFixed(1).replace('.0', '');
    return `${kg} kg`;
  }
  return `${gram} gr`;
}
