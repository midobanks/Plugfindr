import type {
  SpecialistId,
  SpecialistProfileDraft,
  SpecialistProfileStatus,
  ValidatedSpecialistProfile,
} from '@plugfindr/domain';

export type SpecialistProfileReceipt = {
  readonly specialistId: SpecialistId;
  readonly status: SpecialistProfileStatus;
  readonly submittedAt: Date;
  readonly completeness: number;
};

export type SaveSpecialistDraftInput = {
  readonly specialistId: SpecialistId;
  readonly draft: SpecialistProfileDraft;
  readonly updatedAt: Date;
};

export type SubmitSpecialistProfileInput = {
  readonly specialistId: SpecialistId;
  readonly profile: ValidatedSpecialistProfile;
  readonly submittedAt: Date;
  readonly completeness: number;
};

export interface SpecialistProfileStore {
  saveDraft(input: SaveSpecialistDraftInput): Promise<void>;
  submit(input: SubmitSpecialistProfileInput): Promise<SpecialistProfileReceipt>;
  get(specialistId: SpecialistId): Promise<SpecialistProfileReceipt | null>;
}
