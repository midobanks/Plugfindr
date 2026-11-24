import { describe, expect, it } from 'vitest';
import { InvalidTransitionError, ValidationError } from './errors';
import { asId } from './ids';
import type { ReportId, UserId } from './ids';
import {
  createReport,
  REPORT_SLA_HOURS,
  REPORT_STATES,
  toReportReceipt,
  transitionReport,
} from './reports';

const now = new Date('2027-03-12T09:00:00Z');
const reportId = asId<ReportId>('report-fake-001');
const reporterId = asId<UserId>('business-fake-001');

const input = {
  id: reportId,
  reporterId,
  targetType: 'message' as const,
  targetId: 'message-fake-001',
  reason: 'harassment_or_abuse' as const,
  now,
};

describe('report intake', () => {
  it('opens a report with a 24 hour first-response deadline', () => {
    const report = createReport(input);

    expect(report.status).toBe('open');
    expect(report.reporterId).toBe(reporterId);
    expect(report.submittedAt).toEqual(now);
    expect(report.slaDueAt).toEqual(new Date(now.getTime() + 24 * 60 * 60 * 1000));
    expect(REPORT_SLA_HOURS).toBe(24);
    expect(toReportReceipt(report)).toEqual({
      id: reportId,
      status: 'open',
      submittedAt: now,
      slaDueAt: report.slaDueAt,
    });
  });

  it('trims the target identifier and refuses blank targets', () => {
    expect(createReport({ ...input, targetId: '  message-fake-001  ' }).targetId).toBe(
      'message-fake-001',
    );
    expect(() => createReport({ ...input, targetId: '   ' })).toThrow(ValidationError);
    expect(() => createReport({ ...input, targetId: 'x'.repeat(201) })).toThrow(ValidationError);
  });

  it('rejects unknown reasons and targets', () => {
    expect(() => createReport({ ...input, reason: 'because' as never })).toThrow(ValidationError);
    expect(() => createReport({ ...input, targetType: 'email' as never })).toThrow(ValidationError);
  });

  it('allows a trust reviewer to move a report through review', () => {
    const reviewing = transitionReport('open', 'in_review', reportId, 'reviewer-001', now);
    const resolved = transitionReport(reviewing.state, 'resolved', reportId, 'reviewer-001', now);

    expect(resolved.state).toBe('resolved');
    expect(REPORT_STATES).toHaveLength(4);
  });

  it('rejects skipped, backward and terminal transitions', () => {
    expect(() => transitionReport('open', 'resolved', reportId, 'reviewer-001', now)).toThrow(
      InvalidTransitionError,
    );
    expect(() => transitionReport('in_review', 'open', reportId, 'reviewer-001', now)).toThrow(
      InvalidTransitionError,
    );
    expect(() => transitionReport('resolved', 'in_review', reportId, 'reviewer-001', now)).toThrow(
      InvalidTransitionError,
    );
  });
});
