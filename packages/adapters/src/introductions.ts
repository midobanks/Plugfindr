import type { Introduction, IntroductionState, IntroductionId } from '@plugfindr/domain';

export interface IntroductionStore {
  create(introduction: Introduction): Promise<Introduction>;
  get(id: IntroductionId): Promise<Introduction | null>;
  recordState(
    id: IntroductionId,
    state: IntroductionState,
    actorId: string,
    occurredAt: Date,
    details?: { readonly declineReason?: string; readonly conversationThreadId?: string },
  ): Promise<Introduction | null>;
}
