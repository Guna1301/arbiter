import LeakyBucketLimiter from "./LeakyBucketLimiter.js";
import TokenBucketLimiter from "./TokenBucketLimiter.js";

export default class LimiterFactory {
    static create(algorithm){
        if(algorithm=== "token-bucket"){
            return new TokenBucketLimiter();
        }
        return new LeakyBucketLimiter();
    }
}