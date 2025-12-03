import { GraphQLError } from 'graphql';

/**
 * PUBLIC_INTERFACE
 * AppError: Standardized error with code and safe extensions for GraphQL surface.
 */
export class AppError extends Error {
  constructor(message, { code = 'INTERNAL', httpStatus = 500, details = undefined } = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

/**
 * PUBLIC_INTERFACE
 * toGraphQLError: Convert Error/AppError to GraphQLError with extensions.
 */
export function toGraphQLError(err, defaultCode = 'INTERNAL') {
  if (err instanceof GraphQLError) return err;

  const code = err?.code || defaultCode;
  const extensions = {
    code,
    httpStatus: err?.httpStatus || 500,
  };

  if (process.env.NODE_ENV !== 'production') {
    // Show details in non-prod only
    extensions.details = err?.details;
    extensions.originalName = err?.name;
  }

  return new GraphQLError(err?.message || 'Unexpected error', { extensions });
}

/**
 * PUBLIC_INTERFACE
 * common errors helpers
 */
export const errors = {
  unauthenticated(message = 'Not authenticated') {
    return new AppError(message, { code: 'UNAUTHENTICATED', httpStatus: 401 });
  },
  forbidden(message = 'Not authorized') {
    return new AppError(message, { code: 'FORBIDDEN', httpStatus: 403 });
  },
  badRequest(message = 'Bad request', details) {
    return new AppError(message, { code: 'BAD_REQUEST', httpStatus: 400, details });
  },
  notFound(resource = 'Resource') {
    return new AppError(`${resource} not found`, { code: 'NOT_FOUND', httpStatus: 404 });
  },
  conflict(message = 'Conflict') {
    return new AppError(message, { code: 'CONFLICT', httpStatus: 409 });
  },
};
