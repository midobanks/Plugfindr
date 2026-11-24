import type { Match, MatchId, MatchStage, RequestId } from '@plugfindr/domain';

export interface MatchStore {
  getShortlist(requestId: RequestId): Promise<readonly Match[]>;
  getById(matchId: MatchId): Promise<Match | null>;
  saveShortlist(requestId: RequestId, matches: readonly Match[]): Promise<void>;
  recordStage(
    matchId: MatchId,
    stage: MatchStage,
    actorId: string,
    occurredAt: Date,
  ): Promise<void>;
}
