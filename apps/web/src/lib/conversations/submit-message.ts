import type { ConversationStore, RateLimiter } from '@plugfindr/adapters';
import {
  asId,
  postConversationMessage,
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

export async function submitConversationMessage(input: {
  conversationStore: ConversationStore | null;
  limiter: RateLimiter | null;
  actorId: UserId;
  threadId: string;
  messageId: string;
  body: string;
  now: Date;
}): Promise<ConversationMessageView> {
  if (input.conversationStore === null || input.limiter === null) {
    throw new ServiceUnavailableError();
  }

  const decision = await input.limiter.check({
    key: `conversation-message:${input.actorId}`,
    now: input.now,
  });
  if (!decision.allowed) {
    throw new RateLimitError(decision.retryAfterSeconds);
  }

  const id = asId<ConversationThreadId>(input.threadId);
  const thread = await input.conversationStore.get(id);
  if (thread === null) {
    throw new ValidationError('Conversation not found');
  }

  const message = postConversationMessage(
    thread,
    asId<MessageId>(input.messageId),
    input.actorId,
    input.body,
    input.now,
  );
  await input.conversationStore.addMessage(message);
  return toConversationMessageView(thread, message, input.actorId);
}
