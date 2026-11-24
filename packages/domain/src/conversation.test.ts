import { describe, expect, it } from 'vitest';
import { AuthorizationError, ValidationError } from './errors';
import { asId } from './ids';
import type {
  BusinessId,
  ConversationThreadId,
  IntroductionId,
  MatchId,
  MessageId,
  RequestId,
  SpecialistId,
  UserId,
} from './ids';
import type { Introduction } from './introductions';
import {
  markConversationMessageRead,
  openConversationThread,
  postConversationMessage,
  toConversationMessageView,
} from './conversation';
import type { ConversationThread } from './conversation';

const now = new Date('2027-03-12T00:00:00Z');
const threadId = 'intro-thread:intro-fake-001';
const businessId = asId<BusinessId>('business-fake-001');
const specialistId = asId<SpecialistId>('specialist-fake-001');
const outsiderId = asId<UserId>('user-fake-outsider');

const introduction: Introduction = {
  id: asId<IntroductionId>('intro-fake-001'),
  requestId: asId<RequestId>('request-fake-001'),
  matchId: asId<MatchId>('match-fake-001'),
  businessId,
  specialistId,
  state: 'accepted',
  briefSummary: 'Need a product designer for a fintech dashboard refresh.',
  budgetSummary: '₦250,000 to ₦400,000',
  timeline: 'Four weeks from March',
  declineReason: null,
  createdAt: now,
  responseDueAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
  conversationThreadId: threadId,
};

const thread: ConversationThread = {
  id: asId<ConversationThreadId>(threadId),
  introductionId: introduction.id,
  businessId,
  specialistId,
  createdAt: now,
};

describe('conversation threads', () => {
  it('opens only for accepted introductions with a matching thread id', () => {
    expect(openConversationThread(introduction, threadId, now).id).toBe(threadId);
    expect(() =>
      openConversationThread({ ...introduction, state: 'requested' }, threadId, now),
    ).toThrow(ValidationError);
    expect(() => openConversationThread(introduction, 'intro-thread:other', now)).toThrow(
      ValidationError,
    );
  });

  it('restricts messages to the two parties', () => {
    expect(
      postConversationMessage(
        thread,
        asId<MessageId>('message-fake-001'),
        asId<UserId>('business-fake-001'),
        'Hello ọ',
        now,
      ).senderParty,
    ).toBe('business');
    expect(() =>
      postConversationMessage(
        thread,
        asId<MessageId>('message-fake-002'),
        outsiderId,
        'Hello',
        now,
      ),
    ).toThrow(AuthorizationError);
  });

  it('rejects invalid message bodies', () => {
    expect(() =>
      postConversationMessage(
        thread,
        asId<MessageId>('message-fake-003'),
        asId<UserId>('specialist-fake-001'),
        '   ',
        now,
      ),
    ).toThrow(ValidationError);
    expect(() =>
      postConversationMessage(
        thread,
        asId<MessageId>('message-fake-004'),
        asId<UserId>('specialist-fake-001'),
        'a'.repeat(4001),
        now,
      ),
    ).toThrow(ValidationError);
  });

  it('allows only the recipient to mark a message read', () => {
    const message = postConversationMessage(
      thread,
      asId<MessageId>('message-fake-005'),
      asId<UserId>('specialist-fake-001'),
      'Ready to start.',
      now,
    );

    expect(() =>
      markConversationMessageRead(thread, message, asId<UserId>('specialist-fake-001'), now),
    ).toThrow(ValidationError);
    expect(
      markConversationMessageRead(thread, message, asId<UserId>('business-fake-001'), now).readAt,
    ).toEqual(now);
    expect(() => toConversationMessageView(thread, message, outsiderId)).toThrow(
      AuthorizationError,
    );
  });
});
