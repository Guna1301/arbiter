import { createClient } from "redis";

export function createRedisClient() {
  const client = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        console.log(`Redis reconnect attempt: ${retries}`);
        return Math.min(retries * 100, 3000);
      }
    }
  });

  client.on("connect", () => console.log("Redis connected"));
  client.on("error", (err) => console.error("Redis error:", err));

  return client;
}