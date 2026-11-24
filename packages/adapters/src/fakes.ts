import { asId, isSessionActive } from '@plugfindr/domain';
import type {
  AuthMethod,
  Session,
  UserId,
  UserRole,
  ValidatedRequestBrief,
  ValidatedSpecialistProfile,
  SpecialistId,
  SpecialistProfileDraft,
} from '@plugfindr/domain';
import type {
  EmailPasswordVerifier,
  GoogleIdentity,
  GoogleTokenVerifier,
  OtpChallenge,
  OtpProvider,
  OtpRequest,
  OtpVerificationResult,
  RateLimiter,
  SessionStore,
} from './auth';
import type { RequestReceipt, RequestStore } from './requests';
import type { SpecialistProfileReceipt, SpecialistProfileStore } from './specialists';
import type { CalendarProvider } from './calendar';
import type { BookingLinkInput } from './calendar';
import type { KycCheckInput, KycCheckResult, KycProvider } from './kyc';
import type { OutboundMessage, MessagingProvider } from './messaging';
import type { CreateHoldInput, PaymentEvent, PaymentsProvider } from './payments';
import type { PublicSpecialistDocument, SearchFilters, SearchService } from './search';
import type { StorageProvider } from './storage';

export class FakeKycProvider implements KycProvider {
  async submitCheck(input: KycCheckInput): Promise<KycCheckResult> {
    return { reference: input.reference, status: 'pending', checkedAt: new Date(0) };
  }

  async getCheck(reference: string): Promise<KycCheckResult> {
    return {
      reference,
      status: reference === 'rejected-check' ? 'rejected' : 'approved',
      checkedAt: new Date(0),
    };
  }
}

export class FakeMessagingProvider implements MessagingProvider {
  private readonly messages: OutboundMessage[] = [];

  get sent(): readonly OutboundMessage[] {
    return this.messages;
  }

  async send(message: OutboundMessage): Promise<void> {
    this.messages.push(message);
  }
}

export class FakeSearchService implements SearchService {
  private readonly documents = new Map<string, PublicSpecialistDocument>();

  async indexSpecialist(document: PublicSpecialistDocument): Promise<void> {
    this.documents.set(document.specialistId, document);
  }

  async removeSpecialist(specialistId: string): Promise<void> {
    this.documents.delete(specialistId);
  }

  async search(
    query: string,
    filters?: SearchFilters,
  ): Promise<readonly PublicSpecialistDocument[]> {
    const needle = query.trim().toLowerCase();
    const results: PublicSpecialistDocument[] = [];
    for (const document of this.documents.values()) {
      if (filters?.availableOnly === true && document.availability !== 'available_now') continue;
      if (
        filters?.location !== undefined &&
        document.location?.toLowerCase() !== filters.location.toLowerCase()
      ) {
        continue;
      }
      const haystack = [document.headline, ...document.skills].join(' ').toLowerCase();
      if (needle.length > 0 && !haystack.includes(needle)) continue;
      results.push(document);
    }
    return results;
  }
}

export class FakeStorageProvider implements StorageProvider {
  private readonly objects = new Map<string, Uint8Array>();

  async putPrivateObject(input: {
    readonly storageKey: string;
    readonly contentType: string;
    readonly bytes: Uint8Array;
  }): Promise<string> {
    this.objects.set(input.storageKey, input.bytes);
    return input.storageKey;
  }

  async createSignedUrl(storageKey: string, expiresInSeconds: number): Promise<string> {
    return `fake://signed/${encodeURIComponent(storageKey)}?expires=${expiresInSeconds}`;
  }

  async deleteObject(storageKey: string): Promise<void> {
    this.objects.delete(storageKey);
  }
}

export class FakePaymentsProvider implements PaymentsProvider {
  async verifyWebhook(rawBody: string, signature: string): Promise<PaymentEvent> {
    if (signature !== 'fake-signature') {
      throw new Error('Invalid webhook signature');
    }
    const parsed: unknown = JSON.parse(rawBody);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid webhook payload');
    }
    const record = parsed as Record<string, unknown>;
    if (
      typeof record['id'] !== 'string' ||
      typeof record['type'] !== 'string' ||
      typeof record['engagementId'] !== 'string'
    ) {
      throw new Error('Invalid webhook payload');
    }
    return { id: record['id'], type: record['type'], engagementId: record['engagementId'] };
  }

  async createHold(input: CreateHoldInput): Promise<{ readonly reference: string }> {
    return { reference: `fake-hold-${input.engagementId}` };
  }

  async releaseHold(): Promise<void> {
    return;
  }
}

export class FakeCalendarProvider implements CalendarProvider {
  async createBookingLink(input: BookingLinkInput): Promise<string> {
    return `fake://booking/${input.specialistId}/${input.businessId}`;
  }
}

type StoredOtpChallenge = OtpChallenge & {
  readonly destination: string;
  readonly code: string;
};

export class FakeOtpProvider implements OtpProvider {
  private readonly challenges = new Map<string, StoredOtpChallenge>();
  private counter = 0;

  async requestCode(input: OtpRequest): Promise<OtpChallenge> {
    this.counter += 1;
    const challenge: StoredOtpChallenge = {
      id: `otp-fake-${this.counter}`,
      destination: input.destination,
      channel: input.channel,
      purpose: input.purpose,
      expiresAt: new Date(input.requestedAt.getTime() + 10 * 60 * 1000),
      attemptsRemaining: 3,
      code: '000000',
    };
    this.challenges.set(challenge.id, challenge);
    return {
      id: challenge.id,
      channel: challenge.channel,
      purpose: challenge.purpose,
      expiresAt: challenge.expiresAt,
      attemptsRemaining: challenge.attemptsRemaining,
    };
  }

  async verifyCode(input: {
    challengeId: string;
    code: string;
    attemptedAt: Date;
  }): Promise<OtpVerificationResult | null> {
    const challenge = this.challenges.get(input.challengeId);
    if (
      challenge === undefined ||
      challenge.attemptsRemaining < 1 ||
      input.attemptedAt >= challenge.expiresAt
    ) {
      return null;
    }
    if (input.code !== challenge.code) {
      this.challenges.set(challenge.id, {
        ...challenge,
        attemptsRemaining: challenge.attemptsRemaining - 1,
      });
      return null;
    }
    this.challenges.delete(input.challengeId);
    return {
      destination: challenge.destination,
      channel: challenge.channel,
      purpose: challenge.purpose,
    };
  }

  codeFor(challengeId: string): string | null {
    return this.challenges.get(challengeId)?.code ?? null;
  }
}

export class FakeGoogleTokenVerifier implements GoogleTokenVerifier {
  async verifyIdToken(input: {
    idToken: string;
    audience: string;
    now: Date;
  }): Promise<GoogleIdentity | null> {
    if (input.idToken !== 'valid-google-token' || input.audience.length === 0) {
      return null;
    }
    return {
      subject: 'google-fake-subject-001',
      email: 'fake.user@example.test',
      emailVerified: true,
    };
  }
}

export class FakeEmailPasswordVerifier implements EmailPasswordVerifier {
  async verify(input: { email: string; password: string }): Promise<{
    actorId: UserId;
    role: UserRole;
  } | null> {
    if (input.password !== 'fake-password-for-tests') {
      return null;
    }
    return {
      actorId: asId<UserId>('user-fake-001'),
      role: input.email.includes('specialist') ? 'specialist' : 'business',
    };
  }
}

export class FakeSessionStore implements SessionStore {
  private readonly sessions = new Map<string, Session>();
  private counter = 0;

  async create(input: {
    actorId: UserId;
    role: UserRole;
    method: AuthMethod;
    createdAt: Date;
    expiresAt: Date;
    idleExpiresAt: Date;
  }): Promise<Session> {
    this.counter += 1;
    const session: Session = {
      id: `session-fake-${this.counter}`,
      actorId: input.actorId,
      role: input.role,
      method: input.method,
      createdAt: input.createdAt,
      expiresAt: input.expiresAt,
      idleExpiresAt: input.idleExpiresAt,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async get(sessionId: string, now: Date): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    if (session === undefined) {
      return null;
    }
    if (!isSessionActive(session, now)) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  async touch(sessionId: string, now: Date, idleExpiresAt: Date): Promise<Session | null> {
    const session = await this.get(sessionId, now);
    if (session === null) {
      return null;
    }
    const touched: Session = { ...session, idleExpiresAt };
    this.sessions.set(sessionId, touched);
    return touched;
  }

  async revoke(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}

export class FakeRequestStore implements RequestStore {
  private readonly receipts: RequestReceipt[] = [];
  private counter = 0;

  async create(input: {
    actorId: UserId;
    brief: ValidatedRequestBrief;
    submittedAt: Date;
  }): Promise<RequestReceipt> {
    this.counter += 1;
    const receipt: RequestReceipt = {
      id: `request-fake-${this.counter}`,
      status: 'submitted',
      submittedAt: input.submittedAt,
    };
    this.receipts.push(receipt);
    return receipt;
  }

  created(): readonly RequestReceipt[] {
    return this.receipts;
  }
}

export class FakeSpecialistProfileStore implements SpecialistProfileStore {
  private readonly drafts = new Map<string, SpecialistProfileDraft>();
  private readonly receipts = new Map<string, SpecialistProfileReceipt>();

  async saveDraft(input: {
    specialistId: SpecialistId;
    draft: SpecialistProfileDraft;
    updatedAt: Date;
  }): Promise<void> {
    this.drafts.set(input.specialistId, input.draft);
  }

  async submit(input: {
    specialistId: SpecialistId;
    profile: ValidatedSpecialistProfile;
    submittedAt: Date;
    completeness: number;
  }): Promise<SpecialistProfileReceipt> {
    const receipt: SpecialistProfileReceipt = {
      specialistId: input.specialistId,
      status: 'pending',
      submittedAt: input.submittedAt,
      completeness: input.completeness,
    };
    this.receipts.set(input.specialistId, receipt);
    return receipt;
  }

  async get(specialistId: SpecialistId): Promise<SpecialistProfileReceipt | null> {
    return this.receipts.get(specialistId) ?? null;
  }

  draftFor(specialistId: SpecialistId): SpecialistProfileDraft | null {
    return this.drafts.get(specialistId) ?? null;
  }
}

export class FakeRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit = 5,
    private readonly windowMs = 60_000,
  ) {}

  async check(input: { key: string; now: Date }): Promise<{
    allowed: boolean;
    retryAfterSeconds: number;
  }> {
    const cutoff = input.now.getTime() - this.windowMs;
    const recent = (this.hits.get(input.key) ?? []).filter((time) => time > cutoff);
    const oldest = recent[0];
    if (oldest !== undefined && recent.length >= this.limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldest + this.windowMs - input.now.getTime()) / 1000),
      );
      return { allowed: false, retryAfterSeconds };
    }
    recent.push(input.now.getTime());
    this.hits.set(input.key, recent);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
