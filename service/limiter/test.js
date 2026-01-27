import LimiterFactory from "./LimiterFactory.js";
import MemoryStore from "../storage/MemoryStore.js";

const store = new MemoryStore();
const limiter = LimiterFactory.create("leaky-bucket", store);

for (let i = 0; i < 10; i++) {
  console.log(await limiter.consume("user1", 5, 10));
}
