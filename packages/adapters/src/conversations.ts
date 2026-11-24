import type {
  ConversationMessage,
  ConversationThread,
  ConversationThreadId,
  IntroductionId,
} from '@plugfindr/domain';

export interface ConversationStore {
  open(thread: ConversationThread): Promise<ConversationThread>;
  get(id: ConversationThreadId): Promise<ConversationThread | null>;
  getByIntroduction(id: IntroductionId): Promise<ConversationThread | null>;
  addMessage(message: ConversationMessage): Promise<ConversationMessage>;
  listMessages(id: ConversationThreadId): Promise<readonly ConversationMessage[]>;
}
