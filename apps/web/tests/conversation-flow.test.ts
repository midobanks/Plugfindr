import { FakeConversationStore, FakeIntroductionStore, FakeRateLimiter } from '@plugfindr/adapters';
import { asId, AuthorizationError, ServiceUnavailableError } from '@plugfindr/domain';
import type {
  BusinessId,
  ConversationThreadId,
  IntroductionId,
  MatchId,
  RequestId,
  SpecialistId,
  UserId,
} from '@plugfindr/domain';
import type { Introduction } from '@plugfindr/domain';
import { describe, expect, it } from 'vitest';
import { acceptIntroductionAndOpenThread } from '../src/lib/conversations/accept-introduction';
import { submitConversationMessage } from '../src/lib/conversations/submit-message';

const now = new Date('2027-03-12T00:00:00Z');
const businessId = asId<BusinessId>('business-fake-001');
const specialistId = asId<SpecialistId>('specialist-fake-001');

function introduction(): Introduction {
  return {
    id: asId<IntroductionId>('intro-fake-001'),
    requestId: asId<RequestId>('request-fake-001'),
    matchId: asId<MatchId>('match-fake-001'),
    businessId,
    specialistId,
    state: 'requested',
    briefSummary: 'Need a product designer for a fintech dashboard refresh.',
    budgetSummary: '₦250,000 to ₦400,000',
    timeline: 'Four weeks from March',
    declineReason: null,
    createdAt: now,
    responseDueAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
    conversationThreadId: null,
  };
}

function introductionStore(): FakeIntroductionStore {
  const store = new FakeIntroductionStore();
  void store.create(introduction());
  return store;
}

describe('introduction acceptance and messaging', () => {
  it('returns 503 scaffolding until stores are connected', async () => {
    await expect(
      acceptIntroductionAndOpenThread({
        introductionStore: null,
        conversationStore: null,
        limiter: null,
        actorId: asId<UserId>('specialist-fake-001'),
        introductionId: 'intro-fake-001',
        now,
      }),
    ).rejects.toThrow(ServiceUnavailableError);
    await expect(
      submitConversationMessage({
        conversationStore: null,
        limiter: null,
        actorId: asId<UserId>('business-fake-001'),
        threadId: 'intro-thread:intro-fake-001',
        messageId: 'message-fake-001',
        body: 'Hello',
        now,
      }),
    ).rejects.toThrow(ServiceUnavailableError);
  });

  it('opens a conversation only when the specialist accepts', async () => {
    const store = introductionStore();
    const conversations = new FakeConversationStore();

    await expect(
      acceptIntroductionAndOpenThread({
        introductionStore: store,
        conversationStore: conversations,
        limiter: new FakeRateLimiter(),
        actorId: asId<UserId>('business-fake-001'),
        introductionId: 'intro-fake-001',
        now,
      }),
    ).rejects.toThrow(AuthorizationError);

    const receipt = await acceptIntroductionAndOpenThread({
      introductionStore: store,
      conversationStore: conversations,
      limiter: new FakeRateLimiter(),
      actorId: asId<UserId>('specialist-fake-001'),
      introductionId: 'intro-fake-001',
      now,
    });

    expect(receipt.conversationThreadId).toBe('intro-thread:intro-fake-001');
    expect((await store.get(asId<IntroductionId>('intro-fake-001')))?.state).toBe('accepted');
    expect(
      await conversations.getByIntroduction(asId<IntroductionId>('intro-fake-001')),
    ).not.toBeNull();
  });

  it('stores messages only from thread participants', async () => {
    const conversations = new FakeConversationStore();
    await conversations.open({
      id: asId<ConversationThreadId>('intro-thread:intro-fake-001'),
      introductionId: asId<IntroductionId>('intro-fake-001'),
      businessId,
      specialistId,
      createdAt: now,
    });

    await expect(
      submitConversationMessage({
        conversationStore: conversations,
        limiter: new FakeRateLimiter(),
        actorId: asId<UserId>('user-fake-outsider'),
        threadId: 'intro-thread:intro-fake-001',
        messageId: 'message-fake-001',
        body: 'Hello',
        now,
      }),
    ).rejects.toThrow(AuthorizationError);

    const message = await submitConversationMessage({
      conversationStore: conversations,
      limiter: new FakeRateLimiter(),
      actorId: asId<UserId>('business-fake-001'),
      threadId: 'intro-thread:intro-fake-001',
      messageId: 'message-fake-002',
      body: '  Hello ọ, are you available?  ',
      now,
    });

    expect(message.body).toBe('Hello ọ, are you available?');
    expect(
      await conversations.listMessages(asId<ConversationThreadId>(message.threadId)),
    ).toHaveLength(1);
  });
});
