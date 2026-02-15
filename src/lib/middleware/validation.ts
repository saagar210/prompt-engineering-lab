import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export function validateRequest<T>(schema: z.ZodSchema) {
  return async (req: NextRequest) => {
    try {
      const body = await req.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.flatten(),
          },
          { status: 400 }
        );
      }
      throw error;
    }
  };
}

export function withValidation<T>(
  schema: z.ZodSchema,
  handler: (data: T, req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = schema.parse(body) as T;
      return await handler(data, req);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.flatten(),
          },
          { status: 400 }
        );
      }
      throw error;
    }
  };
}
