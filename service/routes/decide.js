import express from 'express';

import PolicyEngine from '../policy/PolicyEngine.js';
import LimiterFactory from '../limiter/LimiterFactory.js';

const router = express.Router();

export default function createDecideRoute({store, abuse, metrics}) {
    router.post("/", async(req,res)=>{
        const start = Date.now();
        
        const {
            key, limit, window,
            algorithm,
            whitelist,
            blacklist
        } = req.body;

        if(!key || !limit || !window){
            return res.status(400).json({error: "key, limit and window are required"});
        }

        const policy = new PolicyEngine({whitelist, blacklist});
        const policyResult = policy.check(key);

        if(policyResult.allowed !== null){
            return res.json({
                allowed: policyResult.allowed,
                reason: policyResult.reason
            });
        }

        const limiter = LimiterFactory.create(algorithm, store);
        const decision = await limiter.consume(key, limit, window);

        const abuseResult = await abuse.record(key, decision.allowed);
        if(abuseResult.banned){
            return res.json({
                allowed: false,
                resetIn: abuseResult.resetIn,
                reason: "abuse detected"
            });
        }

        const latency = Date.now() - start;
        metrics.recordRequest(latency, decision.allowed);

        return res.json(decision);
    });
    return router;
}