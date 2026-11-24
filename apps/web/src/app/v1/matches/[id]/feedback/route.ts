import { randomUUID } from 'node:crypto';
import { RateLimitError, ValidationError } from '@plugfindr/domain';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSessionStore } from '../../../../../lib/auth/runtime';
import { requireSession } from '../../../../../lib/auth/require-session';
import { SESSION_COOKIE_NAME } from '../../../../../lib/auth/session-cookie';
import { toApiError } from '../../../../../lib/http/api-error';
import {
  getMatchFeedbackRateLimiter,
  getMatchFeedbackStore,
} from '../../../../../lib/match-feedback/runtime';
import { parseMatchFeedbackInput } from '../../../../../lib/match-feedback/schema';
import { submitMatchFeedback } from '../../../../../lib/match-feedback/submit';
import { getMatchStore } from '../../../../../lib/matches/runtime';

const MAX_BODY_LENGTH = 2000;

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
    const feedback = parseMatchFeedbackInput(raw);
    const receipt = await submitMatchFeedback({
      matchStore: getMatchStore(),
      feedbackStore: getMatchFeedbackStore(),
      limiter: getMatchFeedbackRateLimiter(),
      actorId: session.actorId,
      matchId: id,
      verdict: feedback.verdict,
      reason: feedback.reason,
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
