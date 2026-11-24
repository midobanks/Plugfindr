import type { ConversationStore, RateLimiter, ReportStore } from '@plugfindr/adapters';
import {
  asId,
  conversationParticipantFor,
  createReport,
  RateLimitError,
  ServiceUnavailableError,
  toReportReceipt,
  ValidationError,
} from '@plugfindr/domain';
import type {
  ConversationThreadId,
  MessageId,
  ReportId,
  ReportReason,
  ReportReceipt,
  ReportTargetType,
  UserId,
} from '@plugfindr/domain';

export async function submitReport(input: {
  reportStore: ReportStore | null;
  conversationStore: ConversationStore | null;
  limiter: RateLimiter | null;
  actorId: UserId;
  reportId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  now: Date;
}): Promise<ReportReceipt> {
  if (input.reportStore === null || input.limiter === null) {
    throw new ServiceUnavailableError();
  }

  const decision = await input.limiter.check({
    key: `report:${input.actorId}`,
    now: input.now,
  });
  if (!decision.allowed) {
    throw new RateLimitError(decision.retryAfterSeconds);
  }

  if (input.targetType === 'message') {
    if (input.conversationStore === null) {
      throw new ServiceUnavailableError();
    }
    const message = await input.conversationStore.getMessage(asId<MessageId>(input.targetId));
    if (message === null) {
      throw new ValidationError('Message not found');
    }
    const thread = await input.conversationStore.get(asId<ConversationThreadId>(message.threadId));
    if (thread === null) {
      throw new ValidationError('Conversation not found');
    }
    conversationParticipantFor(thread, input.actorId);
  }

  const report = createReport({
    id: asId<ReportId>(input.reportId),
    reporterId: input.actorId,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    now: input.now,
  });
  await input.reportStore.create(report);
  return toReportReceipt(report);
}
