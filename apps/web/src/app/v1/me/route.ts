import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSessionStore } from '../../../lib/auth/runtime';
import { requireSession } from '../../../lib/auth/require-session';
import { toApiError } from '../../../lib/http/api-error';

export async function GET(): Promise<NextResponse> {
  const requestId = randomUUID();
  try {
    const cookieStore = await cookies();
    const session = await requireSession(getSessionStore(), cookieStore.get('pf_session')?.value);
    return NextResponse.json(
      {
        data: {
          actorId: session.actorId,
          role: session.role,
          method: session.method,
          expiresAt: session.expiresAt.toISOString(),
        },
      },
      { headers: { 'x-request-id': requestId } },
    );
  } catch (error: unknown) {
    const mapped = toApiError(error, requestId);
    return NextResponse.json(mapped.body, {
      status: mapped.status,
      headers: { 'x-request-id': requestId },
    });
  }
}
