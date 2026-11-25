import { randomUUID } from 'node:crypto';
import type { AuditStore, ReportStore } from '@plugfindr/adapters';
import {
  asId,
  createAdminAuditEvent,
  requireAdminPermission,
  ServiceUnavailableError,
  toReportReceipt,
  transitionReport,
  ValidationError,
} from '@plugfindr/domain';
import type {
  AdminAuditAction,
  ReportId,
  ReportReceipt,
  ReportState,
  Session,
} from '@plugfindr/domain';

const ACTION_BY_STATUS: Readonly<Record<Exclude<ReportState, 'open'>, AdminAuditAction>> = {
  in_review: 'report.review',
  resolved: 'report.resolve',
  dismissed: 'report.dismiss',
};

export async function updateReportStatus(input: {
  session: Session | null;
  reportStore: ReportStore | null;
  auditStore: AuditStore | null;
  reportId: string;
  nextStatus: Exclude<ReportState, 'open'>;
  now: Date;
}): Promise<ReportReceipt> {
  const access = requireAdminPermission(input.session, 'moderation.manage', input.now);
  if (input.reportStore === null || input.auditStore === null) {
    throw new ServiceUnavailableError();
  }

  const report = await input.reportStore.get(asId<ReportId>(input.reportId));
  if (report === null) {
    throw new ValidationError('Report not found');
  }

  transitionReport(report.status, input.nextStatus, report.id, access.session.actorId, input.now);
  const updated = { ...report, status: input.nextStatus };
  await input.reportStore.update(updated);
  await input.auditStore.append(
    createAdminAuditEvent({
      id: randomUUID(),
      actorId: access.session.actorId,
      actorRole: access.role,
      action: ACTION_BY_STATUS[input.nextStatus],
      targetType: 'report',
      targetId: report.id,
      occurredAt: input.now,
    }),
  );
  return toReportReceipt(updated);
}
