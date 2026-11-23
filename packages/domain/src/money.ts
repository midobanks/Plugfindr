import type { Kobo } from './ids';

export const NGN = 'NGN' as const;

export type Currency = typeof NGN;

export type Money = {
  readonly amountKobo: Kobo;
  readonly currency: Currency;
};

export function createMoney(amountKobo: Kobo): Money {
  return { amountKobo, currency: NGN };
}
