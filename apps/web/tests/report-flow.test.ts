import { FakeConversationStore, FakeRateLimiter, FakeReportStore } from '@plugfindr/adapters';
import {
  asId,
  AuthorizationError,
  REPORT_SLA_HOURS,
  ServiceUnavailableError,
  ValidationError,
} from '@plugfindr/domain';
import type {
  BusinessId,
  ConversationMessage,
  ConversationThread,
  ConversationThreadId,
  IntroductionId,
  MessageId,
  ReportId,
  SpecialistId,
  UserId,
} from '@plugfindr/domain';
import { describe, expect, it } from 'vitest';
import { submitReport } from '../src/lib/reports/submit';

const now = new Date('2027-03-12T09:00:00Z');
const threadId = asId<ConversationThreadId>('intro-thread:intro-fake-001');
const messageId = asId<MessageId>('message-fake-001');
const reportId = asId<ReportId>('report-fake-001');
const businessId = asId<UserId>('business-fake-001');

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
  body: 'A real message body is not copied into the report.',
  createdAt: now,
  readAt: null,
};

const base = {
  reportId,
  actorId: businessId,
  reason: 'harassment_or_abuse' as const,
  now,
};

async function messageStore(): Promise<FakeConversationStore> {
  const store = new FakeConversationStore();
  await store.open(thread);
  await store.addMessage(message);
  return store;
}

describe('report intake', () => {
  it('returns 503 scaffolding until stores are connected', async () => {
    await expect(
      submitReport({
        ...base,
        reportStore: null,
        conversationStore: null,
        limiter: null,
        targetType: 'specialist',
        targetId: 'specialist-fake-001',
      }),
    ).rejects.toThrow(ServiceUnavailableError);
  });

  it('stores a structured profile report with a 24 hour deadline', async () => {
    const store = new FakeReportStore();
    const receipt = await submitReport({
      ...base,
      reportStore: store,
      conversationStore: null,
      limiter: new FakeRateLimiter(),
      targetType: 'specialist',
      targetId: 'specialist-fake-001',
    });

    expect(receipt).toEqual({
      id: reportId,
      status: 'open',
      submittedAt: now,
      slaDueAt: new Date(now.getTime() + REPORT_SLA_HOURS * 60 * 60 * 1000),
    });
    const stored = await store.get(reportId);
    expect(stored?.reporterId).toBe(businessId);
    expect(stored?.targetType).toBe('specialist');
    expect(stored?.reason).toBe('harassment_or_abuse');
    expect(JSON.stringify(stored)).not.toContain(message.body);
  });

  it('lets a conversation participant report a message', async () => {
    const store = new FakeReportStore();
    const conversationStore = await messageStore();
    const receipt = await submitReport({
      ...base,
      reportStore: store,
      conversationStore,
      limiter: new FakeRateLimiter(),
      targetType: 'message',
      targetId: messageId,
    });

    expect(receipt.status).toBe('open');
    expect((await store.get(reportId))?.targetId).toBe(messageId);
  });

  it('rejects message reports from non-participants and missing messages', async () => {
    const store = new FakeReportStore();
    const conversationStore = await messageStore();

    await expect(
      submitReport({
        ...base,
        actorId: asId<UserId>('user-fake-outsider'),
        reportStore: store,
        conversationStore,
        limiter: new FakeRateLimiter(),
        targetType: 'message',
        targetId: messageId,
      }),
    ).rejects.toThrow(AuthorizationError);

    await expect(
      submitReport({
        ...base,
        reportStore: store,
        conversationStore,
        limiter: new FakeRateLimiter(),
        targetType: 'message',
        targetId: 'message-fake-missing',
      }),
    ).rejects.toThrow(ValidationError);
  });
});
