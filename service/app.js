import express from 'express';
import dotenv from 'dotenv';
import { createClient } from 'redis';

// import MemoryStore from './storage/MemoryStore.js';
import RedisStore from './storage/RedisStore.js';

import AbuseDetector from './abuse/AbuseDetector.js';
import createDecideRoute from './routes/decide.js';
import MetricsCollector from "./metrics/MetricsCollector.js";
import createMetricsRoute from "./routes/metrics.js";
import createHealthRoute from './routes/health.js';

dotenv.config();

const app = express();
app.use(express.json());

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not set");
}

const redisClient = createClient({
  url: redisUrl
});

await redisClient.connect();

// const store = new MemoryStore();
const store = new RedisStore(redisClient);

const abuse = new AbuseDetector(store, {threshold: 5, banTime: 60});

const metrics = new MetricsCollector();


app.use("/decide", createDecideRoute({store, abuse, metrics}));
app.use("/metrics", createMetricsRoute(metrics));
app.use("/health", createHealthRoute());

const PORT = process.env.PORT || 4000;

app.listen(PORT, ()=>{
    console.log(`arbiter service running on port ${PORT}`);
    console.log(`running at: http://localhost:${PORT}`);
})
