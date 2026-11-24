import { FakeConversationStore, FakeRateLimiter } from '@plugfindr/adapters';
import {
  asId,
  AuthorizationError,
  ServiceUnavailableError,
  ValidationError,
} from '@plugfindr/domain';
import type {
  BusinessId,
  ConversationThreadId,
  IntroductionId,
  MessageId,
  SpecialistId,
  UserId,
} from '@plugfindr/domain';
import type { ConversationMessage, ConversationThread } from '@plugfindr/domain';
import { describe, expect, it } from 'vitest';
import { submitReadReceipt } from '../src/lib/conversations/submit-read-receipt';

const now = new Date('2027-03-12T00:00:00Z');
const threadId = asId<ConversationThreadId>('intro-thread:intro-fake-001');
const messageId = asId<MessageId>('message-fake-001');

const thread: ConversationThread = {
  id: threadId,
  introductionId: asId<IntroductionId>('intro-fake-001'),
  businessId: asId<BusinessId>('business-fake-001'),
  specialistId: asId<SpecialistId>('specialist-fake-001'),
  createdAt: now,
};

const message: ConversationMessage = {
  id: messageId,
  threadId,
  senderParty: 'specialist',
  body: 'Ready to start.',
  createdAt: now,
  readAt: null,
};

async function conversationStore(): Promise<FakeConversationStore> {
  const store = new FakeConversationStore();
  await store.open(thread);
  await store.addMessage(message);
  return store;
}

const base = {
  threadId,
  messageId,
  now,
};

describe('conversation read receipts', () => {
  it('returns 503 scaffolding until stores are connected', async () => {
    await expect(
      submitReadReceipt({
        ...base,
        conversationStore: null,
        limiter: null,
        actorId: asId<UserId>('business-fake-001'),
      }),
    ).rejects.toThrow(ServiceUnavailableError);
  });

  it('lets the recipient mark a message read without changing its body', async () => {
    const store = await conversationStore();
    const read = await submitReadReceipt({
      ...base,
      conversationStore: store,
      limiter: new FakeRateLimiter(),
      actorId: asId<UserId>('business-fake-001'),
    });

    expect(read.readAt).toBe(now.toISOString());
    expect(read.body).toBe('Ready to start.');
    expect((await store.getMessage(messageId))?.readAt).toEqual(now);
  });

  it('rejects the sender and non-participants', async () => {
    const store = await conversationStore();

    await expect(
      submitReadReceipt({
        ...base,
        conversationStore: store,
        limiter: new FakeRateLimiter(),
        actorId: asId<UserId>('specialist-fake-001'),
      }),
    ).rejects.toThrow(ValidationError);

    await expect(
      submitReadReceipt({
        ...base,
        conversationStore: store,
        limiter: new FakeRateLimiter(),
        actorId: asId<UserId>('user-fake-outsider'),
      }),
    ).rejects.toThrow(AuthorizationError);
  });
});
