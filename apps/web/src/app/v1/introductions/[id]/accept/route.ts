import { randomUUID } from 'node:crypto';
import { RateLimitError } from '@plugfindr/domain';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSessionStore } from '../../../../../lib/auth/runtime';
import { requireSession } from '../../../../../lib/auth/require-session';
import { SESSION_COOKIE_NAME } from '../../../../../lib/auth/session-cookie';
import { toApiError } from '../../../../../lib/http/api-error';
import { acceptIntroductionAndOpenThread } from '../../../../../lib/conversations/accept-introduction';
import {
  getConversationRateLimiter,
  getConversationStore,
} from '../../../../../lib/conversations/runtime';
import {
  getIntroductionRateLimiter,
  getIntroductionStore,
} from '../../../../../lib/introductions/runtime';

export async function POST(
  _request: Request,
  { params }: { readonly params: Promise<{ readonly id: string }> },
): Promise<NextResponse> {
  const requestId = randomUUID();
  const headers: Record<string, string> = { 'x-request-id': requestId };

  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const session = await requireSession(
      getSessionStore(),
      cookieStore.get(SESSION_COOKIE_NAME)?.value,
    );
    const receipt = await acceptIntroductionAndOpenThread({
      introductionStore: getIntroductionStore(),
      conversationStore: getConversationStore(),
      limiter: getIntroductionRateLimiter() ?? getConversationRateLimiter(),
      actorId: session.actorId,
      introductionId: id,
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
