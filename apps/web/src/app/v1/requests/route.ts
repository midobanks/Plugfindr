import { randomUUID } from 'node:crypto';
import { RateLimitError, ValidationError } from '@plugfindr/domain';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSessionStore } from '../../../lib/auth/runtime';
import { requireSession } from '../../../lib/auth/require-session';
import { SESSION_COOKIE_NAME } from '../../../lib/auth/session-cookie';
import { toApiError } from '../../../lib/http/api-error';
import { getRequestRateLimiter, getRequestStore } from '../../../lib/requests/runtime';
import { parseRequestBrief } from '../../../lib/requests/schema';
import { submitRequest } from '../../../lib/requests/submit';

const MAX_BODY_LENGTH = 32_000;

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = randomUUID();
  const headers: Record<string, string> = { 'x-request-id': requestId };

  try {
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

    const cookieStore = await cookies();
    const session = await requireSession(
      getSessionStore(),
      cookieStore.get(SESSION_COOKIE_NAME)?.value,
    );
    const brief = parseRequestBrief(raw);
    const receipt = await submitRequest({
      store: getRequestStore(),
      limiter: getRequestRateLimiter(),
      actorId: session.actorId,
      brief,
      now: new Date(),
    });

    return NextResponse.json(
      {
        data: {
          id: receipt.id,
          status: receipt.status,
          submittedAt: receipt.submittedAt.toISOString(),
        },
      },
      { status: 201, headers },
    );
  } catch (error: unknown) {
    if (error instanceof RateLimitError) {
      headers['retry-after'] = String(error.retryAfterSeconds);
    }
    const mapped = toApiError(error, requestId);
    return NextResponse.json(mapped.body, { status: mapped.status, headers });
  }
}
