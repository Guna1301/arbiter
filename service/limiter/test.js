import LimiterFactory from "./LimiterFactory.js";

const limiter = LimiterFactory.create("leaky-bucket");

for (let i = 0; i < 10; i++) {
  console.log(await limiter.consume("user1", 5, 10));
}
