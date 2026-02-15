import { NextResponse } from 'next/server';
import { z } from 'zod';

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    code,
    message,
    timestamp: new Date().toISOString(),
  };

  if (details) {
    response.details = details;
  }

  console.error(`[${code}] ${message}`, details);

  return NextResponse.json(response, { status: statusCode });
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof z.ZodError) {
    return createErrorResponse(
      'VALIDATION_ERROR',
      'Request validation failed',
      400,
      error.flatten()
    );
  }

  if (error instanceof SyntaxError) {
    return createErrorResponse(
      'PARSE_ERROR',
      'Invalid JSON in request body',
      400
    );
  }

  if (error instanceof Error) {
    if (error.message.includes('ENOENT')) {
      return createErrorResponse('NOT_FOUND', 'Resource not found', 404);
    }

    if (error.message.includes('Prisma')) {
      return createErrorResponse(
        'DATABASE_ERROR',
        'Database operation failed',
        500,
        { message: error.message }
      );
    }
  }

  return createErrorResponse(
    'INTERNAL_ERROR',
    'Internal server error',
    500,
    { message: error instanceof Error ? error.message : 'Unknown error' }
  );
}
