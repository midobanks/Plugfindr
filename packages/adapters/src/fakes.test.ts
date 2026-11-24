import { asId, asKobo } from '@plugfindr/domain';
import type { SpecialistId } from '@plugfindr/domain';
import { describe, expect, it } from 'vitest';
import { FakeMessagingProvider, FakeSearchService, FakeStorageProvider } from './fakes';

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
});
