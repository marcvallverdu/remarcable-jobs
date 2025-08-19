// Simple in-memory rate limiter for production
// For high-traffic sites, use Redis-based rate limiting

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(options: { windowMs?: number; maxRequests?: number } = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
    this.maxRequests = options.maxRequests || 100; // 100 requests default
  }

  async consume(identifier: string): Promise<{ success: boolean; remaining: number }> {
    const now = Date.now();
    const record = this.store[identifier];

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    if (!record || now > record.resetTime) {
      // Create new record
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      return { success: true, remaining: this.maxRequests - 1 };
    }

    if (record.count >= this.maxRequests) {
      // Rate limit exceeded
      return { success: false, remaining: 0 };
    }

    // Increment counter
    record.count++;
    return { success: true, remaining: this.maxRequests - record.count };
  }

  private cleanup() {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }

  reset(identifier: string) {
    delete this.store[identifier];
  }

  getStatus(identifier: string) {
    const record = this.store[identifier];
    if (!record) {
      return { count: 0, remaining: this.maxRequests, resetTime: null };
    }
    return {
      count: record.count,
      remaining: Math.max(0, this.maxRequests - record.count),
      resetTime: new Date(record.resetTime).toISOString(),
    };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
});

// Middleware helper
export async function checkRateLimit(request: Request): Promise<{ success: boolean; headers: Headers }> {
  const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown';
  
  const { success, remaining } = await rateLimiter.consume(ip);
  
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', process.env.RATE_LIMIT_MAX_REQUESTS || '100');
  headers.set('X-RateLimit-Remaining', remaining.toString());
  
  return { success, headers };
}