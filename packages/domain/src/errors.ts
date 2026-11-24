export type DomainErrorCode =
  | 'INVALID_TRANSITION'
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE';

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

export class AuthenticationError extends DomainError {
  constructor() {
    super('UNAUTHENTICATED', 'Authentication is required');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends DomainError {
  constructor() {
    super('FORBIDDEN', 'This action is not permitted');
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends DomainError {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super('RATE_LIMITED', 'Too many requests');
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class ServiceUnavailableError extends DomainError {
  constructor() {
    super('SERVICE_UNAVAILABLE', 'This service is not available yet');
    this.name = 'ServiceUnavailableError';
  }
}
