import { randomUUID } from 'node:crypto';
import type { AuditStore, ReportStore } from '@plugfindr/adapters';
import {
  createAdminAuditEvent,
  requireAdminPermission,
  ServiceUnavailableError,
} from '@plugfindr/domain';
import type { Report, Session } from '@plugfindr/domain';

export async function listReportsForReview(input: {
  session: Session | null;
  reportStore: ReportStore | null;
  auditStore: AuditStore | null;
  now: Date;
}): Promise<readonly Report[]> {
  const access = requireAdminPermission(input.session, 'reports.read', input.now);
  if (input.reportStore === null || input.auditStore === null) {
    throw new ServiceUnavailableError();
  }

  const reports = await input.reportStore.listForReview();
  for (const report of reports) {
    await input.auditStore.append(
      createAdminAuditEvent({
        id: randomUUID(),
        actorId: access.session.actorId,
        actorRole: access.role,
        action: 'report.view',
        targetType: 'report',
        targetId: report.id,
        occurredAt: input.now,
      }),
    );
  }
  return reports;
}
