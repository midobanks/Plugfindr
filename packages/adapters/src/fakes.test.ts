import { describe, expect, it } from 'vitest';
import { FakeMessagingProvider, FakeSearchService, FakeStorageProvider } from './fakes';

describe('adapter fakes', () => {
  it('searches only indexed public fields', async () => {
    const search = new FakeSearchService();
    await search.indexSpecialist({
      specialistId: 'specialist-001',
      headline: 'Product designer for fintech',
      skills: ['UI/UX design'],
      location: 'Lagos',
      availability: 'available_now',
      badgeTypes: ['identity'],
    });

    const matches = await search.search('fintech', { availableOnly: true, location: 'lagos' });
    expect(matches).toHaveLength(1);
    expect(Object.keys(matches[0] ?? {})).toEqual([
      'specialistId',
      'headline',
      'skills',
      'location',
      'availability',
      'badgeTypes',
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
