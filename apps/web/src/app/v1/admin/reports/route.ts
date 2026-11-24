import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAuditStore } from '../../../../lib/admin/runtime';
import { getSessionStore } from '../../../../lib/auth/runtime';
import { requireAdminSession } from '../../../../lib/auth/require-session';
import { SESSION_COOKIE_NAME } from '../../../../lib/auth/session-cookie';
import { toApiError } from '../../../../lib/http/api-error';
import { listReportsForReview } from '../../../../lib/reports/list-for-review';
import { getReportStore } from '../../../../lib/reports/runtime';

export async function GET(): Promise<NextResponse> {
  const requestId = randomUUID();
  const headers: Record<string, string> = {
    'x-request-id': requestId,
    'cache-control': 'no-store',
  };

  try {
    const now = new Date();
    const cookieStore = await cookies();
    const session = await requireAdminSession(
      getSessionStore(),
      cookieStore.get(SESSION_COOKIE_NAME)?.value,
      now,
    );
    const reports = await listReportsForReview({
      session,
      reportStore: getReportStore(),
      auditStore: getAuditStore(),
      now,
    });

    return NextResponse.json({ data: reports }, { status: 200, headers });
  } catch (error: unknown) {
    const mapped = toApiError(error, requestId);
    return NextResponse.json(mapped.body, { status: mapped.status, headers });
  }
}
