import { randomUUID } from 'node:crypto';
import {
  conversationParticipantFor,
  RateLimitError,
  ServiceUnavailableError,
  toConversationMessageView,
  ValidationError,
} from '@plugfindr/domain';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSessionStore } from '../../../../../lib/auth/runtime';
import { requireSession } from '../../../../../lib/auth/require-session';
import { SESSION_COOKIE_NAME } from '../../../../../lib/auth/session-cookie';
import { toApiError } from '../../../../../lib/http/api-error';
import {
  getConversationRateLimiter,
  getConversationStore,
} from '../../../../../lib/conversations/runtime';
import { parseMessageInput } from '../../../../../lib/conversations/schema';
import { submitConversationMessage } from '../../../../../lib/conversations/submit-message';
import { asId } from '@plugfindr/domain';
import type { ConversationThreadId } from '@plugfindr/domain';

const MAX_BODY_LENGTH = 5000;

export async function GET(
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
    const store = getConversationStore();
    if (store === null) throw new ServiceUnavailableError();

    const thread = await store.get(asId<ConversationThreadId>(id));
    if (thread === null) throw new ValidationError('Conversation not found');
    conversationParticipantFor(thread, session.actorId);

    const messages = await store.listMessages(thread.id);
    const data = messages.map((message) =>
      toConversationMessageView(thread, message, session.actorId),
    );
    return NextResponse.json({ data }, { status: 200, headers });
  } catch (error: unknown) {
    const mapped = toApiError(error, requestId);
    return NextResponse.json(mapped.body, { status: mapped.status, headers });
  }
}

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
    const message = await submitConversationMessage({
      conversationStore: getConversationStore(),
      limiter: getConversationRateLimiter(),
      actorId: session.actorId,
      threadId: id,
      messageId: randomUUID(),
      body: parseMessageInput(raw),
      now: new Date(),
    });

    return NextResponse.json({ data: message }, { status: 201, headers });
  } catch (error: unknown) {
    if (error instanceof RateLimitError) {
      headers['retry-after'] = String(error.retryAfterSeconds);
    }
    const mapped = toApiError(error, requestId);
    return NextResponse.json(mapped.body, { status: mapped.status, headers });
  }
}
