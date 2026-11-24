import { enNG } from '../../i18n/messages/en-NG';

export function formatRate(kobo: number | null): string {
  if (kobo === null) return enNG.discovery.rateOnRequest;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}
