import type { CalendarProvider } from './calendar';
import type { BookingLinkInput } from './calendar';
import type { KycCheckInput, KycCheckResult, KycProvider } from './kyc';
import type { OutboundMessage, MessagingProvider } from './messaging';
import type { CreateHoldInput, PaymentEvent, PaymentsProvider } from './payments';
import type { PublicSpecialistDocument, SearchFilters, SearchService } from './search';
import type { StorageProvider } from './storage';

export class FakeKycProvider implements KycProvider {
  async submitCheck(input: KycCheckInput): Promise<KycCheckResult> {
    return { reference: input.reference, status: 'pending', checkedAt: new Date(0) };
  }

  async getCheck(reference: string): Promise<KycCheckResult> {
    return {
      reference,
      status: reference === 'rejected-check' ? 'rejected' : 'approved',
      checkedAt: new Date(0),
    };
  }
}

export class FakeMessagingProvider implements MessagingProvider {
  private readonly messages: OutboundMessage[] = [];

  get sent(): readonly OutboundMessage[] {
    return this.messages;
  }

  async send(message: OutboundMessage): Promise<void> {
    this.messages.push(message);
  }
}

export class FakeSearchService implements SearchService {
  private readonly documents = new Map<string, PublicSpecialistDocument>();

  async indexSpecialist(document: PublicSpecialistDocument): Promise<void> {
    this.documents.set(document.specialistId, document);
  }

  async removeSpecialist(specialistId: string): Promise<void> {
    this.documents.delete(specialistId);
  }

  async search(
    query: string,
    filters?: SearchFilters,
  ): Promise<readonly PublicSpecialistDocument[]> {
    const needle = query.trim().toLowerCase();
    const results: PublicSpecialistDocument[] = [];
    for (const document of this.documents.values()) {
      if (filters?.availableOnly === true && document.availability !== 'available_now') continue;
      if (
        filters?.location !== undefined &&
        document.location?.toLowerCase() !== filters.location.toLowerCase()
      ) {
        continue;
      }
      const haystack = [document.headline, ...document.skills].join(' ').toLowerCase();
      if (needle.length > 0 && !haystack.includes(needle)) continue;
      results.push(document);
    }
    return results;
  }
}

export class FakeStorageProvider implements StorageProvider {
  private readonly objects = new Map<string, Uint8Array>();

  async putPrivateObject(input: {
    readonly storageKey: string;
    readonly contentType: string;
    readonly bytes: Uint8Array;
  }): Promise<string> {
    this.objects.set(input.storageKey, input.bytes);
    return input.storageKey;
  }

  async createSignedUrl(storageKey: string, expiresInSeconds: number): Promise<string> {
    return `fake://signed/${encodeURIComponent(storageKey)}?expires=${expiresInSeconds}`;
  }

  async deleteObject(storageKey: string): Promise<void> {
    this.objects.delete(storageKey);
  }
}

export class FakePaymentsProvider implements PaymentsProvider {
  async verifyWebhook(rawBody: string, signature: string): Promise<PaymentEvent> {
    if (signature !== 'fake-signature') {
      throw new Error('Invalid webhook signature');
    }
    const parsed: unknown = JSON.parse(rawBody);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid webhook payload');
    }
    const record = parsed as Record<string, unknown>;
    if (
      typeof record['id'] !== 'string' ||
      typeof record['type'] !== 'string' ||
      typeof record['engagementId'] !== 'string'
    ) {
      throw new Error('Invalid webhook payload');
    }
    return { id: record['id'], type: record['type'], engagementId: record['engagementId'] };
  }

  async createHold(input: CreateHoldInput): Promise<{ readonly reference: string }> {
    return { reference: `fake-hold-${input.engagementId}` };
  }

  async releaseHold(): Promise<void> {
    return;
  }
}

export class FakeCalendarProvider implements CalendarProvider {
  async createBookingLink(input: BookingLinkInput): Promise<string> {
    return `fake://booking/${input.specialistId}/${input.businessId}`;
  }
}
