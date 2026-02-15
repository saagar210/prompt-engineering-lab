import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (for single-server deployment)
// For multi-server, use Redis
const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;      // time window in ms
  maxRequests: number;   // max requests per window
}

export function getRateLimitKey(req: NextRequest): string {
  // Use IP address or auth token
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, resetAt: now + config.windowMs };
  }

  if (entry.count < config.maxRequests) {
    entry.count++;
    return { allowed: true, resetAt: entry.resetAt };
  }

  return { allowed: false, resetAt: entry.resetAt };
}

export function withRateLimit(
  config: RateLimitConfig,
  handler: (req: NextRequest, context?: any) => Promise<Response>
) {
  return async (req: NextRequest, context?: any) => {
    const key = getRateLimitKey(req);
    const { allowed, resetAt } = checkRateLimit(key, config);

    if (!allowed) {
      return NextResponse.json(
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          resetAt: new Date(resetAt).toISOString(),
        },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    return await handler(req, context);
  };
}
