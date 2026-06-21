import { getRedisClient } from "./cache.js";
import { query } from "./db.js";
import Redis from "ioredis";

const CHANNEL = "favorites";

interface FavoriteEvent {
  userId: string;
  word: string;
  action: "add" | "remove";
}

/**
 * Publish a favorite event to Redis Pub/Sub.
 * The worker (subscriber) will handle the actual DB persistence.
 */
export async function publishFavoriteEvent(event: FavoriteEvent): Promise<void> {
  try {
    const client = getRedisClient();
    await client.publish(CHANNEL, JSON.stringify(event));
    console.log(`📤 Published favorite event: ${event.action} "${event.word}" for user ${event.userId}`);
  } catch (error) {
    console.error("❌ Failed to publish favorite event:", error);
    // Fallback: persist synchronously if Redis is unavailable
    await handleFavoriteEvent(event);
  }
}

/**
 * Handle a favorite event — executes the actual DB operation.
 */
async function handleFavoriteEvent(event: FavoriteEvent): Promise<void> {
  try {
    if (event.action === "add") {
      await query(
        `INSERT INTO favorites (user_id, word) VALUES ($1, $2) ON CONFLICT (user_id, word) DO NOTHING`,
        [event.userId, event.word]
      );
      console.log(`⭐ Favorite added: "${event.word}" for user ${event.userId}`);
    } else {
      await query(
        `DELETE FROM favorites WHERE user_id = $1 AND word = $2`,
        [event.userId, event.word]
      );
      console.log(`🗑️  Favorite removed: "${event.word}" for user ${event.userId}`);
    }
  } catch (error) {
    console.error(`❌ Failed to handle favorite event:`, error);
  }
}

/**
 * Start the Redis subscriber worker that listens for favorite events
 * and persists them to the database.
 *
 * Uses a separate Redis connection (required for Pub/Sub subscribers).
 */
export async function startFavoriteWorker(): Promise<void> {
  try {
    const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

    // Subscriber needs its own connection
    const subscriber = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy(times: number) {
        if (times > 3) {
          console.warn("⚠️  Favorite worker: Redis connection failed");
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    subscriber.on("error", (err: Error) => {
      console.warn("⚠️  Favorite worker Redis error:", err.message);
    });

    await subscriber.subscribe(CHANNEL);
    console.log(`👷 Favorite worker listening on channel "${CHANNEL}"`);

    subscriber.on("message", async (_channel: string, message: string) => {
      try {
        const event = JSON.parse(message) as FavoriteEvent;
        await handleFavoriteEvent(event);
      } catch (error) {
        console.error("❌ Favorite worker failed to process message:", error);
      }
    });
  } catch (error) {
    console.warn("⚠️  Could not start favorite worker:", error);
  }
}

