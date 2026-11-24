import type { ConversationStore, RateLimiter } from '@plugfindr/adapters';
import {
  asId,
  markConversationMessageRead,
  RateLimitError,
  ServiceUnavailableError,
  toConversationMessageView,
  ValidationError,
} from '@plugfindr/domain';
import type {
  ConversationMessageView,
  ConversationThreadId,
  MessageId,
  UserId,
} from '@plugfindr/domain';

export async function submitReadReceipt(input: {
  conversationStore: ConversationStore | null;
  limiter: RateLimiter | null;
  actorId: UserId;
  threadId: string;
  messageId: string;
  now: Date;
}): Promise<ConversationMessageView> {
  if (input.conversationStore === null || input.limiter === null) {
    throw new ServiceUnavailableError();
  }

  const decision = await input.limiter.check({
    key: `conversation-read:${input.actorId}`,
    now: input.now,
  });
  if (!decision.allowed) {
    throw new RateLimitError(decision.retryAfterSeconds);
  }

  const thread = await input.conversationStore.get(asId<ConversationThreadId>(input.threadId));
  if (thread === null) {
    throw new ValidationError('Conversation not found');
  }
  const messageId = asId<MessageId>(input.messageId);
  const message = await input.conversationStore.getMessage(messageId);
  if (message === null || message.threadId !== thread.id) {
    throw new ValidationError('Message not found');
  }

  const read = markConversationMessageRead(thread, message, input.actorId, input.now);
  await input.conversationStore.markRead(read.id, input.actorId, input.now);
  return toConversationMessageView(thread, read, input.actorId);
}
