import type { ConversationStore, IntroductionStore, RateLimiter } from '@plugfindr/adapters';
import {
  acceptIntroduction,
  asId,
  openConversationThread,
  RateLimitError,
  ServiceUnavailableError,
  ValidationError,
} from '@plugfindr/domain';
import type { IntroductionId, IntroductionState, UserId } from '@plugfindr/domain';

export type IntroductionAcceptanceReceipt = {
  readonly id: IntroductionId;
  readonly state: IntroductionState;
  readonly conversationThreadId: string;
};

export async function acceptIntroductionAndOpenThread(input: {
  introductionStore: IntroductionStore | null;
  conversationStore: ConversationStore | null;
  limiter: RateLimiter | null;
  actorId: UserId;
  introductionId: string;
  now: Date;
}): Promise<IntroductionAcceptanceReceipt> {
  if (
    input.introductionStore === null ||
    input.conversationStore === null ||
    input.limiter === null
  ) {
    throw new ServiceUnavailableError();
  }

  const decision = await input.limiter.check({
    key: `introduction-response:${input.actorId}`,
    now: input.now,
  });
  if (!decision.allowed) {
    throw new RateLimitError(decision.retryAfterSeconds);
  }

  const id = asId<IntroductionId>(input.introductionId);
  const introduction = await input.introductionStore.get(id);
  if (introduction === null) {
    throw new ValidationError('Introduction not found');
  }

  const acceptance = acceptIntroduction(introduction, input.actorId, input.now);
  const thread = openConversationThread(
    {
      ...introduction,
      state: acceptance.transition.state,
      conversationThreadId: acceptance.conversationThreadId,
    },
    acceptance.conversationThreadId,
    input.now,
  );
  await input.introductionStore.recordState(
    id,
    acceptance.transition.state,
    input.actorId,
    input.now,
    { conversationThreadId: thread.id },
  );
  await input.conversationStore.open(thread);

  return {
    id,
    state: acceptance.transition.state,
    conversationThreadId: thread.id,
  };
}
