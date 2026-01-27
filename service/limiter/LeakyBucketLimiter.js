import LimiterInterface from "./LimiterInterface.js";

export default class LeakyBucketLimiter extends LimiterInterface{
    constructor(){
        super();
        this.buckets = new Map();
    }

    async consume(key, limit, windowSec){
        const now = Date.now();
        const leakRate = limit/windowSec;

        if(!this.buckets.has(key)){
            this.buckets.set(key, {water:0, lastLeak: now});
        }

        const bucket = this.buckets.get(key);

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

        return {
            allowed: true,
            remaining: Math.floor(limit - bucket.water),
            resetIn: Math.ceil((bucket.water)/leakRate)
        };
    }

}