import LeakyBucketLimiter from "./LeakyBucketLimiter.js";
import TokenBucketLimiter from "./TokenBucketLimiter.js";

export default class LimiterFactory {
    static create(algorithm, store) {
        if(algorithm=== "token-bucket"){
            return new TokenBucketLimiter(store);
        }
        return new LeakyBucketLimiter(store);
    }
}