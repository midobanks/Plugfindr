import { AuthorizationError, ValidationError } from './errors';
import type {
  BusinessId,
  ConversationThreadId,
  IntroductionId,
  MessageId,
  SpecialistId,
  UserId,
} from './ids';
import { asId } from './ids';
import type { Introduction } from './introductions';

export type ConversationParty = 'business' | 'specialist';

export type ConversationThread = {
  readonly id: ConversationThreadId;
  readonly introductionId: IntroductionId;
  readonly businessId: BusinessId;
  readonly specialistId: SpecialistId;
  readonly createdAt: Date;
};

export type ConversationMessage = {
  readonly id: MessageId;
  readonly threadId: ConversationThreadId;
  readonly senderParty: ConversationParty;
  readonly body: string;
  readonly createdAt: Date;
  readonly readAt: Date | null;
};

export type ConversationMessageView = {
  readonly id: MessageId;
  readonly threadId: ConversationThreadId;
  readonly senderParty: ConversationParty;
  readonly body: string;
  readonly createdAt: string;
  readonly readAt: string | null;
};

const MIN_MESSAGE_LENGTH = 1;
const MAX_MESSAGE_LENGTH = 4000;

function hasControlCharacters(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127) {
      return true;
    }
  }
  return false;
}

function requireMessageBody(value: string): string {
  const trimmed = value.trim();
  if (
    trimmed.length < MIN_MESSAGE_LENGTH ||
    trimmed.length > MAX_MESSAGE_LENGTH ||
    hasControlCharacters(trimmed)
  ) {
    throw new ValidationError('Message must be between 1 and 4000 characters');
  }
  return trimmed;
}

export function conversationParticipantFor(
  thread: ConversationThread,
  actorId: UserId,
): ConversationParty {
  const actor = String(actorId);
  if (String(thread.businessId) === actor) return 'business';
  if (String(thread.specialistId) === actor) return 'specialist';
  throw new AuthorizationError();
}

export function openConversationThread(
  introduction: Introduction,
  threadId: string,
  now: Date,
): ConversationThread {
  if (introduction.state !== 'accepted') {
    throw new ValidationError('Only accepted introductions can open a conversation');
  }
  if (introduction.conversationThreadId !== threadId) {
    throw new ValidationError('Conversation thread does not match the introduction');
  }

  return {
    id: asId<ConversationThreadId>(threadId),
    introductionId: introduction.id,
    businessId: introduction.businessId,
    specialistId: introduction.specialistId,
    createdAt: now,
  };
}

export function postConversationMessage(
  thread: ConversationThread,
  messageId: MessageId,
  senderId: UserId,
  body: string,
  now: Date,
): ConversationMessage {
  return {
    id: messageId,
    threadId: thread.id,
    senderParty: conversationParticipantFor(thread, senderId),
    body: requireMessageBody(body),
    createdAt: now,
    readAt: null,
  };
}

export function markConversationMessageRead(
  thread: ConversationThread,
  message: ConversationMessage,
  actorId: UserId,
  now: Date,
): ConversationMessage {
  const party = conversationParticipantFor(thread, actorId);
  if (party === message.senderParty) {
    throw new ValidationError('A sender cannot mark their own message as read');
  }
  return { ...message, readAt: now };
}

export function toConversationMessageView(
  thread: ConversationThread,
  message: ConversationMessage,
  actorId: UserId,
): ConversationMessageView {
  conversationParticipantFor(thread, actorId);
  return {
    id: message.id,
    threadId: message.threadId,
    senderParty: message.senderParty,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    readAt: message.readAt?.toISOString() ?? null,
  };
}
