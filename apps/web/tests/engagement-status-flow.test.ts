import { FakeEngagementStore, FakeRateLimiter } from '@plugfindr/adapters';
import { asId, AuthorizationError, ServiceUnavailableError } from '@plugfindr/domain';
import type { EngagementId, UserId } from '@plugfindr/domain';
import { describe, expect, it } from 'vitest';
import { submitEngagementStatus } from '../src/lib/engagements/submit-status';

const now = new Date('2027-03-12T00:00:00Z');
const engagementId = asId<EngagementId>('engagement-fake-001');

function storeWithEngagement(): FakeEngagementStore {
  const store = new FakeEngagementStore();
  store.put({
    id: engagementId,
    businessId: 'business-fake-001',
    specialistId: 'specialist-fake-001',
    state: 'in_progress',
    completedAt: null,
  });
  return store;
}

const base = {
  engagementId: 'engagement-fake-001',
  state: 'completed' as const,
  now,
};

describe('engagement status submission', () => {
  it('returns 503 scaffolding until stores are connected', async () => {
    await expect(
      submitEngagementStatus({
        ...base,
        store: null,
        limiter: null,
        actorId: asId<UserId>('business-fake-001'),
      }),
    ).rejects.toThrow(ServiceUnavailableError);
  });

  it('accepts completion from a party and records completedAt', async () => {
    const store = storeWithEngagement();
    const receipt = await submitEngagementStatus({
      ...base,
      store,
      limiter: new FakeRateLimiter(),
      actorId: asId<UserId>('specialist-fake-001'),
    });

    expect(receipt.state).toBe('completed');
    expect(receipt.completedAt).toBe(now.toISOString());
    expect((await store.get(engagementId))?.state).toBe('completed');
  });

  it('rejects updates from non-parties', async () => {
    await expect(
      submitEngagementStatus({
        ...base,
        store: storeWithEngagement(),
        limiter: new FakeRateLimiter(),
        actorId: asId<UserId>('user-fake-stranger'),
      }),
    ).rejects.toThrow(AuthorizationError);
  });
});
