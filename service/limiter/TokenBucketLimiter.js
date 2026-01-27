import LimiterInterface from './LimiterInterface.js';

export default class TokenBucketLimiter extends LimiterInterface {
    constructor(store){
        super();
        this.store = store;
    }

    async consume(key, limit, windowSec){
        const now = Date.now();
        const refillRate = limit/windowSec;

        let bucket = await this.store.get(key);

        if(!bucket){
            bucket = {tokens: limit, lastRefill: now};
        }

        const elapsed = (now-bucket.lastRefill)/1000;
        const refill = elapsed*refillRate;

        bucket.tokens = Math.min(limit, bucket.tokens + refill);
        bucket.lastRefill = now;

        if(bucket.tokens<1){
            return {
                allowed: false,
                remaining: 0,
                resetIn: Math.ceil((1-bucket.tokens)/refillRate)
            };
        }

        bucket.tokens -= 1;

        await this.store.set(key, bucket, windowSec);

        return {
            allowed: true,
            remaining: Math.floor(bucket.tokens),
            resetIn: Math.ceil((limit-bucket.tokens)/refillRate)
        }
    }
}