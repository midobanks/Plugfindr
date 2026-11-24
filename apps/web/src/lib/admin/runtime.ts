import type { AuditStore } from '@plugfindr/adapters';

const auditStore: AuditStore | null = null;

export function getAuditStore(): AuditStore | null {
  return auditStore;
}
