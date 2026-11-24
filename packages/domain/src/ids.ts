import { ValidationError } from './errors';

declare const brand: unique symbol;

export type Branded<T extends string> = string & { readonly [brand]: T };

export type UserId = Branded<'UserId'>;
export type BusinessId = Branded<'BusinessId'>;
export type SpecialistId = Branded<'SpecialistId'>;
export type RequestId = Branded<'RequestId'>;
export type MatchId = Branded<'MatchId'>;
export type ReviewId = Branded<'ReviewId'>;
export type IntroductionId = Branded<'IntroductionId'>;
export type ConversationThreadId = Branded<'ConversationThreadId'>;
export type MessageId = Branded<'MessageId'>;
export type EngagementId = Branded<'EngagementId'>;
export type VerificationId = Branded<'VerificationId'>;

export type Kobo = number & { readonly [brand]: 'Kobo' };

export function asId<T extends Branded<string>>(value: string): T {
  return value as T;
}

export function asKobo(value: number): Kobo {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new ValidationError('Kobo amount must be a non-negative safe integer');
  }
  return value as Kobo;
}
