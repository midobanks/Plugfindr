import type { BusinessId, Match, MatchId, MatchStage, RequestId } from '@plugfindr/domain';

export interface MatchStore {
  getShortlist(requestId: RequestId): Promise<readonly Match[]>;
  getById(matchId: MatchId): Promise<Match | null>;
  getOwner(matchId: MatchId): Promise<BusinessId | null>;
  saveShortlist(
    requestId: RequestId,
    matches: readonly Match[],
    businessId?: BusinessId,
  ): Promise<void>;
  recordStage(
    matchId: MatchId,
    stage: MatchStage,
    actorId: string,
    occurredAt: Date,
  ): Promise<void>;
}
