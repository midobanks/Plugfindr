import { ValidationError } from './errors';
import type { StateChangedEvent } from './events';
import type { ReportId, UserId } from './ids';
import { transition } from './state-machine';
import type { StateTransition } from './state-machine';

export const REPORT_SLA_HOURS = 24;

export const REPORT_TARGET_TYPES = ['specialist', 'business', 'message'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const REPORT_REASONS = [
  'fraud_or_scam',
  'harassment_or_abuse',
  'impersonation',
  'off_platform_payment',
  'spam',
  'misrepresentation',
  'other_policy_breach',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATES = ['open', 'in_review', 'resolved', 'dismissed'] as const;
export type ReportState = (typeof REPORT_STATES)[number];

export const REPORT_TRANSITIONS: Readonly<Record<ReportState, readonly ReportState[]>> = {
  open: ['in_review'],
  in_review: ['resolved', 'dismissed'],
  resolved: [],
  dismissed: [],
};

export type Report = {
  readonly id: ReportId;
  readonly reporterId: UserId;
  readonly targetType: ReportTargetType;
  readonly targetId: string;
  readonly reason: ReportReason;
  readonly status: ReportState;
  readonly submittedAt: Date;
  readonly slaDueAt: Date;
};

export type ReportReceipt = {
  readonly id: ReportId;
  readonly status: ReportState;
  readonly submittedAt: Date;
  readonly slaDueAt: Date;
};

export type ReportStateChanged = StateChangedEvent<'ReportStateChanged', ReportState, ReportId>;

export function createReport(input: {
  id: ReportId;
  reporterId: UserId;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  now: Date;
}): Report {
  if (!REPORT_TARGET_TYPES.includes(input.targetType)) {
    throw new ValidationError('Choose a valid report target');
  }
  if (!REPORT_REASONS.includes(input.reason)) {
    throw new ValidationError('Choose a valid report reason');
  }
  const targetId = input.targetId.trim();
  if (targetId.length === 0 || targetId.length > 200) {
    throw new ValidationError('Choose a valid report target');
  }

  return {
    id: input.id,
    reporterId: input.reporterId,
    targetType: input.targetType,
    targetId,
    reason: input.reason,
    status: 'open',
    submittedAt: input.now,
    slaDueAt: new Date(input.now.getTime() + REPORT_SLA_HOURS * 60 * 60 * 1000),
  };
}

export function toReportReceipt(report: Report): ReportReceipt {
  return {
    id: report.id,
    status: report.status,
    submittedAt: report.submittedAt,
    slaDueAt: report.slaDueAt,
  };
}

export function transitionReport(
  current: ReportState,
  next: ReportState,
  reportId: ReportId,
  actorId: string,
  occurredAt: Date,
): StateTransition<ReportState, ReportStateChanged> {
  return transition(
    current,
    next,
    REPORT_TRANSITIONS,
    'ReportStateChanged',
    reportId,
    actorId,
    occurredAt,
  );
}
