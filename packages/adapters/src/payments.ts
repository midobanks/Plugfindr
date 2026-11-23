export type MoneyAmount = {
  readonly amountKobo: number;
  readonly currency: string;
};

export type PaymentEvent = {
  readonly id: string;
  readonly type: string;
  readonly engagementId: string;
};

export type CreateHoldInput = {
  readonly engagementId: string;
  readonly amount: MoneyAmount;
};

export interface PaymentsProvider {
  verifyWebhook(rawBody: string, signature: string): Promise<PaymentEvent>;
  createHold(input: CreateHoldInput): Promise<{ readonly reference: string }>;
  releaseHold(reference: string): Promise<void>;
}
