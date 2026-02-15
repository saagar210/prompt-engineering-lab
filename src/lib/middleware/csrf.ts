import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf-token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCsrfToken(req: NextRequest, token: string): boolean {
  const headerToken = req.headers.get(CSRF_HEADER);
  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;

  // For GET requests, skip validation
  if (SAFE_METHODS.includes(req.method)) {
    return true;
  }

  // For mutations, validate token matches
  return headerToken === cookieToken && cookieToken === token;
}

export function withCsrfProtection(
  handler: (req: NextRequest, context?: any) => Promise<Response>
) {
  return async (req: NextRequest, context?: any) => {
    // Skip CSRF for GET/HEAD/OPTIONS
    if (SAFE_METHODS.includes(req.method)) {
      return await handler(req, context);
    }

    // For mutations, verify CSRF token
    const token = req.headers.get(CSRF_HEADER);
    const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;

    if (!token || !cookieToken || token !== cookieToken) {
      return NextResponse.json(
        {
          code: 'CSRF_VALIDATION_FAILED',
          message: 'CSRF token invalid or missing',
        },
        { status: 403 }
      );
    }

    const response = await handler(req, context);

    // Rotate CSRF token after successful request
    const newToken = generateCsrfToken();
    const nextResponse = NextResponse.next(response);
    nextResponse.cookies.set(CSRF_COOKIE, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return nextResponse;
  };
}
