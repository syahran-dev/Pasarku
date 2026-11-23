export interface CourierRateOption {
  code: string;
  name: string;
  service: string;
  cost: number;
  etd: string;
}

export const SUPPORTED_COURIERS = [
  { code: 'JNE', name: 'Jalur Nugraha Ekakurir (JNE)' },
  { code: 'SICEPAT', name: 'SiCepat Ekspres' },
  { code: 'GOSEND', name: 'GoSend Instant' },
];

/**
 * Server-authoritative shipping cost calculator
 */
export function calculateShippingOptions(
  originCity: string,
  destCity: string,
  weightGram: number
): CourierRateOption[] {
  const weightKg = Math.max(1, Math.ceil(weightGram / 1000));
  const isIntercity = originCity.toLowerCase() !== destCity.toLowerCase();
  const baseRate = isIntercity ? 15000 : 9000;

  return [
    {
      code: 'JNE',
      name: 'JNE',
      service: 'REG (Reguler)',
      cost: baseRate * weightKg,
      etd: isIntercity ? '2-3 hari' : '1-2 hari',
    },
    {
      code: 'JNE',
      name: 'JNE',
      service: 'YES (Yakin Esok Sampai)',
      cost: (baseRate + 12000) * weightKg,
      etd: '1 hari',
    },
    {
      code: 'SICEPAT',
      name: 'SiCepat',
      service: 'SIUNTUNG (Reguler)',
      cost: (baseRate - 1000) * weightKg,
      etd: isIntercity ? '2-3 hari' : '1-2 hari',
    },
    {
      code: 'GOSEND',
      name: 'GoSend',
      service: 'Instant (Maks 20km)',
      cost: isIntercity ? 45000 : 25000,
      etd: '2-4 jam',
    },
  ];
}

/**
 * Generate authentic tracking number for shipping
 */
export function generateTrackingNumber(courierCode: string): string {
  const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
  switch (courierCode.toUpperCase()) {
    case 'JNE':
      return `JNE${randomDigits}`;
    case 'SICEPAT':
      return `004${randomDigits}`;
    case 'GOSEND':
      return `GK-${randomDigits.toString().slice(0, 8)}`;
    default:
      return `PKU${randomDigits}`;
  }
}
