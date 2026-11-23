export type PublicSpecialistDocument = {
  readonly specialistId: string;
  readonly headline: string;
  readonly skills: readonly string[];
  readonly location: string | null;
  readonly availability: string | null;
  readonly badgeTypes: readonly string[];
};

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
