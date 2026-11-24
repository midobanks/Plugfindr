import { randomUUID } from 'node:crypto';
import { RateLimitError } from '@plugfindr/domain';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSessionStore } from '../../../../../../../lib/auth/runtime';
import { requireSession } from '../../../../../../../lib/auth/require-session';
import { SESSION_COOKIE_NAME } from '../../../../../../../lib/auth/session-cookie';
import { toApiError } from '../../../../../../../lib/http/api-error';
import {
  getConversationRateLimiter,
  getConversationStore,
} from '../../../../../../../lib/conversations/runtime';
import { submitReadReceipt } from '../../../../../../../lib/conversations/submit-read-receipt';

export async function POST(
  _request: Request,
  {
    params,
  }: {
    readonly params: Promise<{ readonly id: string; readonly messageId: string }>;
  },
): Promise<NextResponse> {
  const requestId = randomUUID();
  const headers: Record<string, string> = { 'x-request-id': requestId };

  try {
    const { id, messageId } = await params;
    const cookieStore = await cookies();
    const session = await requireSession(
      getSessionStore(),
      cookieStore.get(SESSION_COOKIE_NAME)?.value,
    );
    const message = await submitReadReceipt({
      conversationStore: getConversationStore(),
      limiter: getConversationRateLimiter(),
      actorId: session.actorId,
      threadId: id,
      messageId,
      now: new Date(),
    });

    return NextResponse.json({ data: message }, { status: 200, headers });
  } catch (error: unknown) {
    if (error instanceof RateLimitError) {
      headers['retry-after'] = String(error.retryAfterSeconds);
    }
    const mapped = toApiError(error, requestId);
    return NextResponse.json(mapped.body, { status: mapped.status, headers });
  }
}
