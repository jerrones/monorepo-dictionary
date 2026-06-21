import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const DEFAULT_TTL = 3600; // 1 hour in seconds

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          console.warn("⚠️  Redis connection failed, cache will be unavailable");
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    redis.on("error", (err) => {
      console.warn("⚠️  Redis error:", err.message);
    });

    redis.on("connect", () => {
      console.log("🔴 Redis connected");
    });
  }

  return redis;
}

export async function getCache<T>(key: string): Promise<{ data: T; hit: boolean } | null> {
  try {
    const client = getRedisClient();
    const cached = await client.get(key);

    if (cached) {
      return { data: JSON.parse(cached) as T, hit: true };
    }

    return null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttl: number = DEFAULT_TTL): Promise<void> {
  try {
    const client = getRedisClient();
    await client.set(key, JSON.stringify(value), "EX", ttl);
  } catch {
    // Cache write failure is non-critical
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);

    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch {
    // Cache invalidation failure is non-critical
  }
}
