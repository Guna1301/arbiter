import express from 'express';
import dotenv from 'dotenv';
import { createClient } from 'redis';

// import MemoryStore from './storage/MemoryStore.js';
import RedisStore from './storage/RedisStore.js';

import AbuseDetector from './abuse/AbuseDetector.js';
import createDecideRoute from './routes/decide.js';

dotenv.config();

const app = express();
app.use(express.json());

const redisClient = createClient({
    url : `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

await redisClient.connect();

// const store = new MemoryStore();
const store = new RedisStore(redisClient);

const abuse = new AbuseDetector(store, {threshold: 5, banTime: 60});

app.use("/decide", createDecideRoute({store, abuse}));

const PORT = process.env.PORT || 4000;

app.listen(PORT, ()=>{
    console.log(`arbiter service running on port ${PORT}`);
    console.log(`DECIDE endpoint: http://localhost:${PORT}/decide`);
})
