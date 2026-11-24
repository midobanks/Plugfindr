import { randomUUID } from 'node:crypto';
import { RateLimitError, ValidationError } from '@plugfindr/domain';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSessionStore } from '../../../../../lib/auth/runtime';
import { requireSession } from '../../../../../lib/auth/require-session';
import { SESSION_COOKIE_NAME } from '../../../../../lib/auth/session-cookie';
import { toApiError } from '../../../../../lib/http/api-error';
import {
  getEngagementStatusRateLimiter,
  getEngagementStatusStore,
} from '../../../../../lib/engagements/runtime';
import { parseStatusInput } from '../../../../../lib/engagements/schema';
import { submitEngagementStatus } from '../../../../../lib/engagements/submit-status';

const MAX_BODY_LENGTH = 4000;

export async function POST(
  request: Request,
  { params }: { readonly params: Promise<{ readonly id: string }> },
): Promise<NextResponse> {
  const requestId = randomUUID();
  const headers: Record<string, string> = { 'x-request-id': requestId };

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

    const cookieStore = await cookies();
    const session = await requireSession(
      getSessionStore(),
      cookieStore.get(SESSION_COOKIE_NAME)?.value,
    );
    const state = parseStatusInput(raw);
    const receipt = await submitEngagementStatus({
      store: getEngagementStatusStore(),
      limiter: getEngagementStatusRateLimiter(),
      actorId: session.actorId,
      engagementId: id,
      state,
      now: new Date(),
    });

    return NextResponse.json({ data: receipt }, { status: 200, headers });
  } catch (error: unknown) {
    if (error instanceof RateLimitError) {
      headers['retry-after'] = String(error.retryAfterSeconds);
    }
    const mapped = toApiError(error, requestId);
    return NextResponse.json(mapped.body, { status: mapped.status, headers });
  }
}
