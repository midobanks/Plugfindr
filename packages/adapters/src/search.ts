import type { PublicSpecialist } from '@plugfindr/domain';

export type PublicSpecialistDocument = PublicSpecialist;

export type SearchFilters = {
  readonly category?: string;
  readonly availableOnly?: boolean;
  readonly location?: string;
};

export interface SearchService {
  indexSpecialist(document: PublicSpecialistDocument): Promise<void>;
  removeSpecialist(specialistId: string): Promise<void>;
  search(query: string, filters?: SearchFilters): Promise<readonly PublicSpecialistDocument[]>;
}
