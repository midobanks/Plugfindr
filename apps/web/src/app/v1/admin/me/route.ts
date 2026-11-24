import { randomUUID } from 'node:crypto';
import { requireAdminAccess } from '@plugfindr/domain';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSessionStore } from '../../../../lib/auth/runtime';
import { requireAdminSession } from '../../../../lib/auth/require-session';
import { SESSION_COOKIE_NAME } from '../../../../lib/auth/session-cookie';
import { toApiError } from '../../../../lib/http/api-error';

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
    const access = requireAdminAccess(session, now);

    return NextResponse.json(
      { data: { role: access.role, permissions: access.permissions } },
      { status: 200, headers },
    );
  } catch (error: unknown) {
    const mapped = toApiError(error, requestId);
    return NextResponse.json(mapped.body, { status: mapped.status, headers });
  }
}
