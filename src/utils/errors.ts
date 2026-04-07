import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Standardized API error handler to catch known exceptions and return proper JSON responses.
 */
export function handleError(error: unknown) {
  console.error('[API Error]:', error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation Error',
        details: (error as any).issues.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message
        }))
      },
      { status: 400 }
    );
  }

  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : 'Internal Server Error';
  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}
