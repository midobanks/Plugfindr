import { asId, asKobo } from '@plugfindr/domain';
import type { Match, MatchId, RequestId, SpecialistId } from '@plugfindr/domain';
import { describe, expect, it } from 'vitest';
import {
  FakeMatchStore,
  FakeMessagingProvider,
  FakeSearchService,
  FakeStorageProvider,
} from './fakes';

const specialistId = asId<SpecialistId>('specialist-fake-001');

describe('adapter fakes', () => {
  it('searches only indexed public fields', async () => {
    const search = new FakeSearchService();
    await search.indexSpecialist({
      specialistId,
      name: 'Chidi Okoro',
      headline: 'Product designer for fintech',
      category: 'design',
      skills: ['UI/UX design'],
      location: 'Lagos',
      availability: 'available_now',
      yearsExperience: 7,
      rateFromKobo: asKobo(25000000),
      badges: [
        {
          type: 'identity',
          verifiedAt: new Date('2027-01-10T00:00:00Z'),
          expiresAt: null,
        },
      ],
    });

    const matches = await search.search('fintech', {
      availableOnly: true,
      category: 'design',
      location: 'lagos',
    });
    expect(matches).toHaveLength(1);
    expect(Object.keys(matches[0] ?? {})).toEqual([
      'specialistId',
      'name',
      'headline',
      'category',
      'skills',
      'location',
      'availability',
      'yearsExperience',
      'rateFromKobo',
      'badges',
    ]);
  });

  it('collects outbound messages without sending them anywhere', async () => {
    const messaging = new FakeMessagingProvider();
    await messaging.send({
      userId: 'user-001',
      channel: 'whatsapp',
      template: 'match_ready',
      data: {},
    });

    expect(messaging.sent).toHaveLength(1);
    expect(messaging.sent[0]?.channel).toBe('whatsapp');
  });

  it('issues non-public signed URLs', async () => {
    const storage = new FakeStorageProvider();
    const url = await storage.createSignedUrl('private/verification/doc', 60);
    expect(url.startsWith('fake://signed/')).toBe(true);
  });

  it('stores shortlists and records opt-in stages', async () => {
    const store = new FakeMatchStore();
    const requestId = asId<RequestId>('request-fake-001');
    const match: Match = {
      matchId: asId<MatchId>('request-fake-001:specialist-fake-001'),
      requestId,
      specialistId,
      score: 90,
      stage: 'proposed',
      reasons: [],
      scoreBreakdown: [],
    };

    await store.saveShortlist(requestId, [match]);
    await store.recordStage(match.matchId, 'opted_in', 'actor-fake-001', new Date(0));

    expect((await store.getShortlist(requestId))[0]?.stage).toBe('opted_in');
  });
});
