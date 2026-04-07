import express from "express";
import dotenv from "dotenv";

import { validateEnv } from "./config/env.js";
import { createRedisClient } from "./config/redis.js";

import RedisStore from "./storage/RedisStore.js";
import AbuseDetector from "./abuse/AbuseDetector.js";
import MetricsCollector from "./metrics/MetricsCollector.js";

import createDecideRoute from "./routes/decide.js";
import createMetricsRoute from "./routes/metrics.js";
import createWhoamiRoute from "./routes/whoami.js";

dotenv.config();
validateEnv();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    const redisClient = createRedisClient();
    await redisClient.connect();

    const store = new RedisStore(redisClient);
    const abuse = new AbuseDetector(store, {
      threshold: 5,
      banTime: 60
    });

    const metrics = new MetricsCollector();

    app.use("/decide", createDecideRoute({ store, abuse, metrics }));
    app.use("/metrics", createMetricsRoute(metrics));
    app.use("/whoami", createWhoamiRoute());

    app.get("/health", async (req, res) => {
      try {
        await redisClient.ping();
        res.status(200).json({ status: "ok", redis: "connected" });
      } catch {
        res.status(500).json({ status: "error", redis: "down" });
      }
    });

    app.listen(PORT, () => {
      console.log(`Arbiter running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();