import type { ConversationStore, RateLimiter } from '@plugfindr/adapters';

const conversationStore: ConversationStore | null = null;
const limiter: RateLimiter | null = null;

export function getConversationStore(): ConversationStore | null {
  return conversationStore;
}

export function getConversationRateLimiter(): RateLimiter | null {
  return limiter;
}
