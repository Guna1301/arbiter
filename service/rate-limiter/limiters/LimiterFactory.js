import LeakyBucketLimiter from "./LeakyBucketLimiter.js";
import TokenBucketLimiter from "./TokenBucketLimiter.js";

export default class LimiterFactory {
  static create(algorithm, store) {
    switch (algorithm) {
      case "token-bucket":
        return new TokenBucketLimiter(store);
      case "leaky-bucket":
      default:
        return new LeakyBucketLimiter(store);
    }
  }
}