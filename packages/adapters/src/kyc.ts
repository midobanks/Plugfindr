export type KycCheckInput = {
  readonly reference: string;
  readonly idType: 'nin' | 'bvn' | 'passport' | 'drivers_licence';
  readonly countryCode: 'NG';
};

export type KycCheckResult = {
  readonly reference: string;
  readonly status: 'pending' | 'approved' | 'rejected';
  readonly checkedAt: Date;
};

export interface KycProvider {
  submitCheck(input: KycCheckInput): Promise<KycCheckResult>;
  getCheck(reference: string): Promise<KycCheckResult>;
}
