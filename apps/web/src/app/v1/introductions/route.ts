import { randomUUID } from 'node:crypto';
import { requireRole, RateLimitError, ValidationError } from '@plugfindr/domain';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSessionStore } from '../../../lib/auth/runtime';
import { requireSession } from '../../../lib/auth/require-session';
import { SESSION_COOKIE_NAME } from '../../../lib/auth/session-cookie';
import { toApiError } from '../../../lib/http/api-error';
import {
  getIntroductionRateLimiter,
  getIntroductionStore,
  getMatchStore,
} from '../../../lib/introductions/runtime';
import { parseIntroductionInput } from '../../../lib/introductions/schema';
import { submitIntroduction } from '../../../lib/introductions/submit';

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
    const session = requireRole(
      await requireSession(getSessionStore(), cookieStore.get(SESSION_COOKIE_NAME)?.value),
      ['business'],
      new Date(),
    );
    const parsed = parseIntroductionInput(raw);
    const receipt = await submitIntroduction({
      store: getIntroductionStore(),
      limiter: getIntroductionRateLimiter(),
      matchStore: getMatchStore(),
      actorId: session.actorId,
      matchId: parsed.matchId,
      briefSummary: parsed.briefSummary,
      budgetSummary: parsed.budgetSummary,
      timeline: parsed.timeline,
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
