import type { AdminAuditEvent, AdminAuditTargetType } from '@plugfindr/domain';

export interface AuditStore {
  append(event: AdminAuditEvent): Promise<AdminAuditEvent>;
  listForTarget(
    targetType: AdminAuditTargetType,
    targetId: string,
  ): Promise<readonly AdminAuditEvent[]>;
}
