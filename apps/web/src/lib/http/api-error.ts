import { AuthenticationError, AuthorizationError, ValidationError } from '@plugfindr/domain';
import { enNG } from '../../i18n/messages/en-NG';

export type ApiErrorBody = {
  readonly code: string;
  readonly message: string;
  readonly requestId: string;
};

export type ApiErrorResponse = {
  readonly status: number;
  readonly body: ApiErrorBody;
};

export function toApiError(error: unknown, requestId: string): ApiErrorResponse {
  if (error instanceof AuthenticationError) {
    return {
      status: 401,
      body: {
        code: error.code,
        message: enNG.errors.unauthenticated,
        requestId,
      },
    };
  }
  if (error instanceof AuthorizationError) {
    return {
      status: 403,
      body: { code: error.code, message: enNG.errors.forbidden, requestId },
    };
  }
  if (error instanceof ValidationError) {
    return {
      status: 400,
      body: { code: error.code, message: enNG.errors.validation, requestId },
    };
  }
  return {
    status: 500,
    body: { code: 'INTERNAL', message: enNG.errors.internal, requestId },
  };
}
