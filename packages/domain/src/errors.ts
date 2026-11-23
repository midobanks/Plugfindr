export type DomainErrorCode = 'INVALID_TRANSITION' | 'VALIDATION_FAILED';

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export class InvalidTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super('INVALID_TRANSITION', `Cannot transition from '${from}' to '${to}'`);
    this.name = 'InvalidTransitionError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super('VALIDATION_FAILED', message);
    this.name = 'ValidationError';
  }
}
