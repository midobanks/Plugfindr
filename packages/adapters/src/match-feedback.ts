import type { MatchFeedback, MatchFeedbackId, MatchId, RequestId } from '@plugfindr/domain';

export interface MatchFeedbackStore {
  create(feedback: MatchFeedback): Promise<MatchFeedback>;
  get(id: MatchFeedbackId): Promise<MatchFeedback | null>;
  listForMatch(id: MatchId): Promise<readonly MatchFeedback[]>;
  listForRequest(id: RequestId): Promise<readonly MatchFeedback[]>;
}
