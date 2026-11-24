import type { UserId, ValidatedRequestBrief } from '@plugfindr/domain';

export type RequestReceipt = {
  readonly id: string;
  readonly status: 'submitted';
  readonly submittedAt: Date;
};

export interface RequestStore {
  create(input: {
    actorId: UserId;
    brief: ValidatedRequestBrief;
    submittedAt: Date;
  }): Promise<RequestReceipt>;
}
