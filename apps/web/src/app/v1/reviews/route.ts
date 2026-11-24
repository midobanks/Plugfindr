import { randomUUID } from 'node:crypto';
import { RateLimitError, ValidationError } from '@plugfindr/domain';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSessionStore } from '../../../lib/auth/runtime';
import { requireSession } from '../../../lib/auth/require-session';
import { SESSION_COOKIE_NAME } from '../../../lib/auth/session-cookie';
import { toApiError } from '../../../lib/http/api-error';
import {
  getEngagementStore,
  getReviewRateLimiter,
  getReviewStore,
} from '../../../lib/reviews/runtime';
import { parseReviewInput } from '../../../lib/reviews/schema';
import { submitReviewForEngagement } from '../../../lib/reviews/submit';

const MAX_BODY_LENGTH = 8000;

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
    const parsed = parseReviewInput(raw);
    const receipt = await submitReviewForEngagement({
      store: getReviewStore(),
      engagementStore: getEngagementStore(),
      limiter: getReviewRateLimiter(),
      actorId: session.actorId,
      engagementId: parsed.engagementId,
      ratings: parsed.ratings,
      comment: parsed.comment,
      privateFeedback: parsed.privateFeedback,
      now: new Date(),
    });

    return NextResponse.json({ data: receipt }, { status: 201, headers });
  } catch (error: unknown) {
    if (error instanceof RateLimitError) {
      headers['retry-after'] = String(error.retryAfterSeconds);
    }
    const mapped = toApiError(error, requestId);
    return NextResponse.json(mapped.body, { status: mapped.status, headers });
  }
}
