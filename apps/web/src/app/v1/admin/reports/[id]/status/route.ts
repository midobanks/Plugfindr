import { randomUUID } from 'node:crypto';
import { ValidationError } from '@plugfindr/domain';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAuditStore } from '../../../../../../lib/admin/runtime';
import { getSessionStore } from '../../../../../../lib/auth/runtime';
import { requireAdminSession } from '../../../../../../lib/auth/require-session';
import { SESSION_COOKIE_NAME } from '../../../../../../lib/auth/session-cookie';
import { toApiError } from '../../../../../../lib/http/api-error';
import { getReportStore } from '../../../../../../lib/reports/runtime';
import { parseReportStatusInput } from '../../../../../../lib/reports/schema';
import { updateReportStatus } from '../../../../../../lib/reports/update-status';

const MAX_BODY_LENGTH = 500;

export async function POST(
  request: Request,
  { params }: { readonly params: Promise<{ readonly id: string }> },
): Promise<NextResponse> {
  const requestId = randomUUID();
  const headers: Record<string, string> = {
    'x-request-id': requestId,
    'cache-control': 'no-store',
  };

  try {
    const { id } = await params;
    const body = await request.text();
    if (body.length > MAX_BODY_LENGTH) {
      throw new ValidationError('Request is too large');
    }
    let raw: unknown;
    try {
      raw = JSON.parse(body);
    } catch {
      throw new ValidationError('Invalid JSON');
    }

    const now = new Date();
    const cookieStore = await cookies();
    const session = await requireAdminSession(
      getSessionStore(),
      cookieStore.get(SESSION_COOKIE_NAME)?.value,
      now,
    );
    const input = parseReportStatusInput(raw);
    const receipt = await updateReportStatus({
      session,
      reportStore: getReportStore(),
      auditStore: getAuditStore(),
      reportId: id,
      nextStatus: input.status,
      now,
    });

    return NextResponse.json({ data: receipt }, { status: 200, headers });
  } catch (error: unknown) {
    const mapped = toApiError(error, requestId);
    return NextResponse.json(mapped.body, { status: mapped.status, headers });
  }
}
