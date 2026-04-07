import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Determine if we have the tokens to use Upstash Redis
const hasRedisConfig = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Create a new ratelimiter, that allows 5 requests per 30 seconds
export const ratelimit = hasRedisConfig
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '30 s'),
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  : null;

/**
 * Checks the ratelimit for a given identifier (e.g. IP address).
 * If no configuration exists, it bypasses the ratelimit gracefully.
 */
export async function checkRateLimit(identifier: string) {
  if (!ratelimit) {
    // Graceful fallback for local dev or missing tokens
    return { success: true, limit: 100, remaining: 99, reset: 0 };
  }

  return await ratelimit.limit(identifier);
}
