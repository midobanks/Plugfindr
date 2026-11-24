import { asId, isSessionActive } from '@plugfindr/domain';
import type {
  AuthMethod,
  BusinessId,
  Session,
  UserId,
  UserRole,
  ValidatedRequestBrief,
  ValidatedSpecialistProfile,
  SpecialistId,
  SpecialistProfileDraft,
  Match,
  MatchFeedback,
  MatchFeedbackId,
  MatchId,
  MatchStage,
  RequestId,
  Introduction,
  IntroductionId,
  IntroductionState,
  ConversationMessage,
  ConversationThread,
  ConversationThreadId,
  Review,
  ReviewId,
  EngagementId,
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
import type { MatchStore } from './matches';
import type { MatchFeedbackStore } from './match-feedback';
import type { IntroductionStore } from './introductions';
import type { ConversationStore } from './conversations';
import type { EngagementForStore, EngagementStore, ReviewStore } from './reviews';
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
      if (filters?.category !== undefined && document.category !== filters.category) {
        continue;
      }
      if (
        filters?.location !== undefined &&
        document.location?.toLowerCase() !== filters.location.toLowerCase()
      ) {
        continue;
      }
      const haystack = [document.name, document.headline, ...document.skills]
        .join(' ')
        .toLowerCase();
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

export class FakeEngagementStore implements EngagementStore {
  private readonly engagements = new Map<string, EngagementForStore>();

  async get(id: EngagementId): Promise<EngagementForStore | null> {
    return this.engagements.get(id) ?? null;
  }

  async recordState(
    id: EngagementId,
    state: EngagementForStore['state'],
    completedAt: Date | null,
    actorId: string,
    occurredAt: Date,
  ): Promise<EngagementForStore | null> {
    void actorId;
    void occurredAt;
    const current = this.engagements.get(id);
    if (current === undefined) return null;
    const next: EngagementForStore = { ...current, state, completedAt };
    this.engagements.set(id, next);
    return next;
  }

  async listForParty(actorId: string): Promise<readonly EngagementForStore[]> {
    return [...this.engagements.values()].filter(
      (engagement) => engagement.businessId === actorId || engagement.specialistId === actorId,
    );
  }

  put(engagement: EngagementForStore): void {
    this.engagements.set(engagement.id, engagement);
  }
}

export class FakeReviewStore implements ReviewStore {
  private readonly reviews = new Map<string, Review>();

  async create(review: Review): Promise<Review> {
    this.reviews.set(review.id, review);
    return review;
  }

  async listForSpecialist(specialistId: string): Promise<readonly Review[]> {
    return [...this.reviews.values()].filter((review) => review.specialistId === specialistId);
  }

  async listForEngagement(id: EngagementId): Promise<readonly Review[]> {
    return [...this.reviews.values()].filter((review) => review.engagementId === id);
  }

  async get(id: ReviewId): Promise<Review | null> {
    return this.reviews.get(id) ?? null;
  }
}

export class FakeIntroductionStore implements IntroductionStore {
  private readonly introductions = new Map<string, Introduction>();

  async create(introduction: Introduction): Promise<Introduction> {
    this.introductions.set(introduction.id, introduction);
    return introduction;
  }

  async get(id: IntroductionId): Promise<Introduction | null> {
    return this.introductions.get(id) ?? null;
  }

  async recordState(
    id: IntroductionId,
    state: IntroductionState,
    actorId: string,
    occurredAt: Date,
    details?: { readonly declineReason?: string; readonly conversationThreadId?: string },
  ): Promise<Introduction | null> {
    void actorId;
    void occurredAt;
    const current = this.introductions.get(id);
    if (current === undefined) return null;
    const next: Introduction = {
      ...current,
      state,
      declineReason: details?.declineReason ?? current.declineReason,
      conversationThreadId: details?.conversationThreadId ?? current.conversationThreadId,
    };
    this.introductions.set(id, next);
    return next;
  }
}

export class FakeConversationStore implements ConversationStore {
  private readonly threads = new Map<string, ConversationThread>();
  private readonly messages = new Map<string, ConversationMessage>();

  async open(thread: ConversationThread): Promise<ConversationThread> {
    this.threads.set(thread.id, thread);
    return thread;
  }

  async get(id: ConversationThreadId): Promise<ConversationThread | null> {
    return this.threads.get(id) ?? null;
  }

  async getByIntroduction(id: IntroductionId): Promise<ConversationThread | null> {
    return [...this.threads.values()].find((thread) => thread.introductionId === id) ?? null;
  }

  async addMessage(message: ConversationMessage): Promise<ConversationMessage> {
    this.messages.set(message.id, message);
    return message;
  }

  async listMessages(id: ConversationThreadId): Promise<readonly ConversationMessage[]> {
    return [...this.messages.values()]
      .filter((message) => message.threadId === id)
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }
}

export class FakeMatchStore implements MatchStore {
  private readonly shortlists = new Map<string, Match[]>();

  async getShortlist(requestId: RequestId): Promise<readonly Match[]> {
    return [...(this.shortlists.get(requestId) ?? [])];
  }

  private readonly owners = new Map<string, BusinessId>();

  async getById(matchId: MatchId): Promise<Match | null> {
    for (const matches of this.shortlists.values()) {
      const found = matches.find((match) => match.matchId === matchId);
      if (found !== undefined) return found;
    }
    return null;
  }

  async getOwner(matchId: MatchId): Promise<BusinessId | null> {
    return this.owners.get(matchId) ?? null;
  }

  async saveShortlist(
    requestId: RequestId,
    matches: readonly Match[],
    businessId?: BusinessId,
  ): Promise<void> {
    this.shortlists.set(requestId, [...matches]);
    if (businessId !== undefined) {
      for (const match of matches) {
        this.owners.set(match.matchId, businessId);
      }
    }
  }

  async recordStage(
    matchId: MatchId,
    stage: MatchStage,
    actorId: string,
    occurredAt: Date,
  ): Promise<void> {
    void actorId;
    void occurredAt;
    for (const [requestId, matches] of this.shortlists) {
      const next = matches.map((match) =>
        match.matchId === matchId ? { ...match, stage } : match,
      );
      this.shortlists.set(requestId, next);
    }
  }
}

export class FakeMatchFeedbackStore implements MatchFeedbackStore {
  private readonly feedback = new Map<string, MatchFeedback>();

  async create(feedback: MatchFeedback): Promise<MatchFeedback> {
    this.feedback.set(feedback.id, feedback);
    return feedback;
  }

  async get(id: MatchFeedbackId): Promise<MatchFeedback | null> {
    return this.feedback.get(id) ?? null;
  }

  async listForMatch(id: MatchId): Promise<readonly MatchFeedback[]> {
    return [...this.feedback.values()].filter((feedback) => feedback.matchId === id);
  }

  async listForRequest(id: RequestId): Promise<readonly MatchFeedback[]> {
    return [...this.feedback.values()].filter((feedback) => feedback.requestId === id);
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
