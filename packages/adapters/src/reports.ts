import type { Report, ReportId, UserId } from '@plugfindr/domain';

export interface ReportStore {
  create(report: Report): Promise<Report>;
  get(id: ReportId): Promise<Report | null>;
  listByReporter(reporterId: UserId): Promise<readonly Report[]>;
  listForReview(): Promise<readonly Report[]>;
}
