import { FakeAuditStore, FakeReportStore } from '@plugfindr/adapters';
import {
  asId,
  AuthenticationError,
  AuthorizationError,
  createReport,
  InvalidTransitionError,
  ServiceUnavailableError,
  ValidationError,
} from '@plugfindr/domain';
import type { ReportId, Session, UserId, UserRole } from '@plugfindr/domain';
import { describe, expect, it } from 'vitest';
import { updateReportStatus } from '../src/lib/reports/update-status';

const now = new Date('2027-03-12T09:00:00Z');
const reportId = asId<ReportId>('report-fake-001');
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
      id: reportId,
      reporterId,
      targetType: 'specialist',
      targetId: 'specialist-fake-001',
      reason: 'fraud_or_scam',
      now,
    }),
  );
  return store;
}

describe('trust report status updates', () => {
  it('moves a report through review and resolution with audit events', async () => {
    const reports = await reportStore();
    const audit = new FakeAuditStore();
    const session = makeSession('trust_safety');

    const reviewing = await updateReportStatus({
      session,
      reportStore: reports,
      auditStore: audit,
      reportId,
      nextStatus: 'in_review',
      now,
    });
    const resolved = await updateReportStatus({
      session,
      reportStore: reports,
      auditStore: audit,
      reportId,
      nextStatus: 'resolved',
      now,
    });

    expect(reviewing.status).toBe('in_review');
    expect(resolved.status).toBe('resolved');
    expect((await reports.get(reportId))?.status).toBe('resolved');
    const events = await audit.listForTarget('report', reportId);
    expect(events.map((event) => event.action)).toEqual(['report.review', 'report.resolve']);
    expect(events.every((event) => event.actorRole === 'trust_safety')).toBe(true);
  });

  it('allows dismissal only after review starts', async () => {
    const reports = await reportStore();
    const audit = new FakeAuditStore();
    const session = makeSession('admin');

    await expect(
      updateReportStatus({
        session,
        reportStore: reports,
        auditStore: audit,
        reportId,
        nextStatus: 'dismissed',
        now,
      }),
    ).rejects.toThrow(InvalidTransitionError);
    expect(await audit.listForTarget('report', reportId)).toHaveLength(0);

    await updateReportStatus({
      session,
      reportStore: reports,
      auditStore: audit,
      reportId,
      nextStatus: 'in_review',
      now,
    });
    await updateReportStatus({
      session,
      reportStore: reports,
      auditStore: audit,
      reportId,
      nextStatus: 'dismissed',
      now,
    });

    const events = await audit.listForTarget('report', reportId);
    expect(events.map((event) => event.action)).toEqual(['report.review', 'report.dismiss']);
  });

  it('requires moderation.manage and fresh MFA', async () => {
    const reports = await reportStore();
    const audit = new FakeAuditStore();
    const base = {
      reportStore: reports,
      auditStore: audit,
      reportId,
      nextStatus: 'in_review' as const,
      now,
    };

    await expect(
      updateReportStatus({ ...base, session: makeSession('business', null) }),
    ).rejects.toThrow(AuthorizationError);
    await expect(updateReportStatus({ ...base, session: makeSession('reviewer') })).rejects.toThrow(
      AuthorizationError,
    );
    await expect(updateReportStatus({ ...base, session: makeSession('support') })).rejects.toThrow(
      AuthorizationError,
    );
    await expect(
      updateReportStatus({ ...base, session: makeSession('trust_safety', null) }),
    ).rejects.toThrow(AuthenticationError);
  });

  it('rejects missing reports and disconnected stores', async () => {
    const audit = new FakeAuditStore();
    const session = makeSession('trust_safety');

    await expect(
      updateReportStatus({
        session,
        reportStore: await reportStore(),
        auditStore: audit,
        reportId: 'report-fake-missing',
        nextStatus: 'in_review',
        now,
      }),
    ).rejects.toThrow(ValidationError);

    await expect(
      updateReportStatus({
        session,
        reportStore: null,
        auditStore: null,
        reportId,
        nextStatus: 'in_review',
        now,
      }),
    ).rejects.toThrow(ServiceUnavailableError);
  });
});
