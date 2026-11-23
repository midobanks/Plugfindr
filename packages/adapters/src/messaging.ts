export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'push';

export type OutboundMessage = {
  readonly userId: string;
  readonly channel: NotificationChannel;
  readonly template: string;
  readonly data: Readonly<Record<string, string>>;
};

export interface MessagingProvider {
  send(message: OutboundMessage): Promise<void>;
}
