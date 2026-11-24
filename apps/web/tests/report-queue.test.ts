import { FakeAuditStore, FakeReportStore } from '@plugfindr/adapters';
import {
  asId,
  AuthenticationError,
  AuthorizationError,
  createReport,
  ServiceUnavailableError,
} from '@plugfindr/domain';
import type { ReportId, Session, UserId, UserRole } from '@plugfindr/domain';
import { describe, expect, it } from 'vitest';
import { listReportsForReview } from '../src/lib/reports/list-for-review';

const now = new Date('2027-03-12T09:00:00Z');
const reporterId = asId<UserId>('business-fake-001');

function makeSession(role: UserRole, mfaVerifiedAt: Date | null = now): Session {
  return {
    id: 'session-admin-001',
    actorId: asId<UserId>('user-admin-001'),
    role,
    createdAt: new Date('2027-03-11T00:00:00Z'),
    expiresAt: new Date('2027-03-13T00:00:00Z'),
    idleExpiresAt: new Date('2027-03-12T12:00:00Z'),
    method: 'email_password',
    mfaVerifiedAt,
  };
}

async function reportStore(): Promise<FakeReportStore> {
  const store = new FakeReportStore();
  await store.create(
    createReport({
      id: asId<ReportId>('report-fake-late'),
      reporterId,
      targetType: 'specialist',
      targetId: 'specialist-fake-001',
      reason: 'spam',
      now,
    }),
  );
  await store.create(
    createReport({
      id: asId<ReportId>('report-fake-early'),
      reporterId,
      targetType: 'message',
      targetId: 'message-fake-001',
      reason: 'fraud_or_scam',
      now: new Date(now.getTime() - 60 * 60 * 1000),
    }),
  );
  return store;
}

describe('trust report queue', () => {
  it('returns open reports ordered by SLA and audits every report view', async () => {
    const reports = await reportStore();
    const audit = new FakeAuditStore();

    const queue = await listReportsForReview({
      session: makeSession('trust_safety'),
      reportStore: reports,
      auditStore: audit,
      now,
    });

    expect(queue.map((report) => report.id)).toEqual(['report-fake-early', 'report-fake-late']);
    const earlyEvents = await audit.listForTarget('report', 'report-fake-early');
    const lateEvents = await audit.listForTarget('report', 'report-fake-late');
    expect(earlyEvents).toHaveLength(1);
    expect(lateEvents).toHaveLength(1);
    expect(earlyEvents[0]?.action).toBe('report.view');
    expect(earlyEvents[0]?.actorRole).toBe('trust_safety');
  });

  it('requires an admin role, reports permission and fresh MFA', async () => {
    const reports = await reportStore();
    const audit = new FakeAuditStore();
    const base = { reportStore: reports, auditStore: audit, now };

    await expect(
      listReportsForReview({ ...base, session: makeSession('business', null) }),
    ).rejects.toThrow(AuthorizationError);
    await expect(
      listReportsForReview({ ...base, session: makeSession('reviewer') }),
    ).rejects.toThrow(AuthorizationError);
    await expect(
      listReportsForReview({ ...base, session: makeSession('trust_safety', null) }),
    ).rejects.toThrow(AuthenticationError);
    await expect(
      listReportsForReview({
        ...base,
        session: makeSession('trust_safety', new Date('2027-03-12T08:00:00Z')),
      }),
    ).rejects.toThrow(AuthenticationError);
  });

  it('fails closed when the queue or audit store is not connected', async () => {
    await expect(
      listReportsForReview({
        session: makeSession('admin'),
        reportStore: null,
        auditStore: new FakeAuditStore(),
        now,
      }),
    ).rejects.toThrow(ServiceUnavailableError);

    await expect(
      listReportsForReview({
        session: makeSession('admin'),
        reportStore: await reportStore(),
        auditStore: null,
        now,
      }),
    ).rejects.toThrow(ServiceUnavailableError);
  });
});
