import { asId } from '@plugfindr/domain';
import type { UserId } from '@plugfindr/domain';
import { describe, expect, it } from 'vitest';
import {
  FakeEmailPasswordVerifier,
  FakeGoogleTokenVerifier,
  FakeOtpProvider,
  FakeRateLimiter,
  FakeSessionStore,
} from './fakes';

const now = new Date('2027-03-12T00:00:00Z');

describe('auth adapter fakes', () => {
  it('issues a single-use OTP without exposing the destination or code', async () => {
    const provider = new FakeOtpProvider();
    const challenge = await provider.requestCode({
      destination: '+234 000 000 0000',
      channel: 'phone',
      purpose: 'sign_in',
      requestedAt: now,
    });

    expect('destination' in challenge).toBe(false);
    expect('code' in challenge).toBe(false);
    expect(challenge.attemptsRemaining).toBe(3);
    expect(
      await provider.verifyCode({ challengeId: challenge.id, code: 'wrong', attemptedAt: now }),
    ).toBeNull();
    expect(
      await provider.verifyCode({
        challengeId: challenge.id,
        code: provider.codeFor(challenge.id) ?? '',
        attemptedAt: now,
      }),
    ).not.toBeNull();
    expect(
      await provider.verifyCode({ challengeId: challenge.id, code: '000000', attemptedAt: now }),
    ).toBeNull();
  });

  it('rejects an expired OTP challenge', async () => {
    const provider = new FakeOtpProvider();
    const challenge = await provider.requestCode({
      destination: 'fake.user@example.test',
      channel: 'email',
      purpose: 'verify_contact',
      requestedAt: new Date('2027-03-11T00:00:00Z'),
    });

    expect(
      await provider.verifyCode({ challengeId: challenge.id, code: '000000', attemptedAt: now }),
    ).toBeNull();
  });

  it('creates, reads and revokes sessions without storing credentials', async () => {
    const store = new FakeSessionStore();
    const session = await store.create({
      actorId: asId<UserId>('user-fake-001'),
      role: 'business',
      method: 'google',
      createdAt: now,
      expiresAt: new Date('2027-03-13T00:00:00Z'),
      idleExpiresAt: new Date('2027-03-12T06:00:00Z'),
    });

    expect(await store.get(session.id, now)).toEqual(session);
    await store.revoke(session.id);
    expect(await store.get(session.id, now)).toBeNull();
  });

  it('limits repeated attempts by key', async () => {
    const limiter = new FakeRateLimiter(2, 60_000);
    expect((await limiter.check({ key: 'otp:+234 000 000 0000', now })).allowed).toBe(true);
    expect((await limiter.check({ key: 'otp:+234 000 000 0000', now })).allowed).toBe(true);
    const blocked = await limiter.check({ key: 'otp:+234 000 000 0000', now });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('returns identities only for fake valid credentials', async () => {
    const google = new FakeGoogleTokenVerifier();
    const password = new FakeEmailPasswordVerifier();

    expect(
      await google.verifyIdToken({ idToken: 'valid-google-token', audience: 'web', now }),
    ).not.toBeNull();
    expect(await google.verifyIdToken({ idToken: 'invalid', audience: 'web', now })).toBeNull();
    expect(
      await password.verify({
        email: 'fake.business@example.test',
        password: 'fake-password-for-tests',
      }),
    ).not.toBeNull();
    expect(
      await password.verify({ email: 'fake.business@example.test', password: 'wrong' }),
    ).toBeNull();
  });
});
