import { randomUUID } from 'node:crypto';
import { RateLimitError, ValidationError } from '@plugfindr/domain';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSessionStore } from '../../../lib/auth/runtime';
import { requireSession } from '../../../lib/auth/require-session';
import { SESSION_COOKIE_NAME } from '../../../lib/auth/session-cookie';
import { getConversationStore } from '../../../lib/conversations/runtime';
import { toApiError } from '../../../lib/http/api-error';
import { parseReportInput } from '../../../lib/reports/schema';
import { submitReport } from '../../../lib/reports/submit';
import { getReportRateLimiter, getReportStore } from '../../../lib/reports/runtime';

const MAX_BODY_LENGTH = 2000;

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
    const input = parseReportInput(raw);
    const receipt = await submitReport({
      reportStore: getReportStore(),
      conversationStore: getConversationStore(),
      limiter: getReportRateLimiter(),
      actorId: session.actorId,
      reportId: randomUUID(),
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
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
