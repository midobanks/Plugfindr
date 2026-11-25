import { REPORT_REASONS, REPORT_TARGET_TYPES, ValidationError } from '@plugfindr/domain';
import type { ReportReason, ReportTargetType } from '@plugfindr/domain';
import { z } from 'zod';

export type ParsedReportInput = {
  readonly targetType: ReportTargetType;
  readonly targetId: string;
  readonly reason: ReportReason;
};

export type ParsedReportStatus = {
  readonly status: 'in_review' | 'resolved' | 'dismissed';
};

const reportSchema = z
  .object({
    targetType: z.enum(REPORT_TARGET_TYPES),
    targetId: z.string().trim().min(1).max(200),
    reason: z.enum(REPORT_REASONS),
  })
  .strict();

const reportStatusSchema = z
  .object({
    status: z.enum(['in_review', 'resolved', 'dismissed']),
  })
  .strict();

export function parseReportInput(raw: unknown): ParsedReportInput {
  const result = reportSchema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError('Check the report details');
  }
  return result.data;
}

export function parseReportStatusInput(raw: unknown): ParsedReportStatus {
  const result = reportStatusSchema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError('Choose a valid report status');
  }
  return result.data;
}
