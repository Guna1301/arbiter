import dotenv from "dotenv";
dotenv.config();

import { createRedisClient } from "../config/redis.js";
import LimiterFactory from "../rate-limiter/limiters/LimiterFactory.js";
import RedisStore from "../storage/RedisStore.js";

const redisClient = createRedisClient();
await redisClient.connect();

const store = new RedisStore(redisClient);
const limiter = LimiterFactory.create("leaky-bucket", store);

for (let i = 0; i < 10; i++) {
  console.log(await limiter.consume("user1", 5, 10));
}