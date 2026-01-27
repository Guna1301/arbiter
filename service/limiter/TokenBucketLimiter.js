import LimiterInterface from './LimiterInterface.js';

export default class TokenBucketLimiter extends LimiterInterface {
    constructor(){
        super();
        this.buckets = new Map();
    }

    async consume(key, limit, windowSec){
        const now = Date.now();
        const refillRate = limit/windowSec;

        if(!this.buckets.has(key)){
            this.buckets.set(key, {tokens: limit, lastRefill: now});
        }

        const bucket = this.buckets.get(key);

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

        return {
            allowed: true,
            remaining: Math.floor(bucket.tokens),
            resetIn: Math.ceil((1-bucket.tokens)/refillRate)
        }
    }
}