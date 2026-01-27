import LimiterInterface from "./LimiterInterface.js";

export default class LeakyBucketLimiter extends LimiterInterface{
    constructor(store){
        super();
        this.store = store;
    }

    async consume(key, limit, windowSec){
        const now = Date.now();
        const leakRate = limit/windowSec;

        let bucket = await this.store.get(key);

        if(!bucket){
            bucket = {water:0, lastLeak: now};
        }

        const elapsed = (now - bucket.lastLeak)/1000;
        const leaked = elapsed * leakRate;

        bucket.water = Math.max(0, bucket.water - leaked);
        bucket.lastLeak = now;

        if(bucket.water+1 > limit){
            return{
                allowed: false,
                remaining: 0,
                resetIn: Math.ceil((bucket.water - limit +1)/leakRate)
            }
        }

        bucket.water += 1;

        await this.store.set(key,bucket, windowSec);

        return {
            allowed: true,
            remaining: Math.floor(limit - bucket.water),
            resetIn: Math.ceil((bucket.water)/leakRate)
        };
    }

}