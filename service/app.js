import express from 'express';
import dotenv from 'dotenv';

// import MemoryStore from './storage/MemoryStore.js';
import { createClient } from 'redis';
import RedisStore from './storage/RedisStore.js';

import LimiterFactory from './limiter/LimiterFactory.js';
import PolicyEngine from './policy/PolicyEngine.js';
import AbuseDetector from './abuse/AbuseDetector.js';

dotenv.config();

const app = express();
app.use(express.json());

const redisClient = createClient({
    url : `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

await redisClient.connect();

// const store = new MemoryStore();
const store = new RedisStore(redisClient);
const limiter = LimiterFactory.create("leaky-bucket", store);

const policy = new PolicyEngine({
    whitelist: ["127.0.0.1",],
    blacklist: ["1.2.3.4"]
})

const abuse = new AbuseDetector(store, {threshold: 5, banTime: 60});

app.post("/decide", async(req,res)=>{
    const {key, limit, window} = req.body;

    const policyResult = policy.check(key);
    if(policyResult.allowed !== null){
        return res.json(
            {
                allowed: policyResult.allowed,
                reason: policyResult.reason
            }
        )
    }

    const decision = await limiter.consume(key, limit, window);

    const abuseResult = await abuse.record(key, decision.allowed);
    if(abuseResult.banned){
        return res.json(
            {
                allowed: false,
                resetIn: abuseResult.resetIn,
                reason: "abuse_detected"
            }
        )
    }

    return res.json(decision);
})

const PORT = process.env.PORT || 4000;

app.listen(PORT, ()=>{
    console.log(`arbiter service running on port ${PORT}`);
    console.log(`DECIDE endpoint: http://localhost:${PORT}/decide`);
})
