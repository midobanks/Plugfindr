import type { SearchService } from '@plugfindr/adapters';

const searchService: SearchService | null = null;

export function getSearchService(): SearchService | null {
  return searchService;
}
