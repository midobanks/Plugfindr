import type {
  ConversationMessage,
  ConversationThread,
  ConversationThreadId,
  IntroductionId,
  MessageId,
  UserId,
} from '@plugfindr/domain';

export interface ConversationStore {
  open(thread: ConversationThread): Promise<ConversationThread>;
  get(id: ConversationThreadId): Promise<ConversationThread | null>;
  getByIntroduction(id: IntroductionId): Promise<ConversationThread | null>;
  addMessage(message: ConversationMessage): Promise<ConversationMessage>;
  getMessage(id: MessageId): Promise<ConversationMessage | null>;
  markRead(id: MessageId, actorId: UserId, readAt: Date): Promise<ConversationMessage | null>;
  listMessages(id: ConversationThreadId): Promise<readonly ConversationMessage[]>;
}
