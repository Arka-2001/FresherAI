import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

let redis;

if (redisUrl) {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      // Reconnect with exponential backoff capped at 3 seconds
      return Math.min(times * 150, 3000);
    },
  });
} else {
  console.warn("⚠️ REDIS_URL environment variable is not defined, attempting localhost:6379");
  redis = new Redis({
    retryStrategy(times) {
      return Math.min(times * 200, 3000);
    },
  });
}

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redis.on("ready", () => {
  console.log("✅ Redis is ready to accept commands");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

export default redis;
