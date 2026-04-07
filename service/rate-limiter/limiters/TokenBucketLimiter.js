import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import LimiterInterface from "./LimiterInterface.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const script = fs.readFileSync(
  path.join(__dirname, "../lua/tokenBucket.lua"),
  "utf8"
);

export default class TokenBucketLimiter extends LimiterInterface {
  constructor(store) {
    super();
    this.store = store;
    this.script = script;
  }

  async consume(key, limit, windowSec) {
    const now = Date.now();

    const result = await this.store.client.eval(this.script, {
      keys: [key],
      arguments: [
        String(limit),
        String(windowSec),
        String(now)
      ]
    });

    return {
      allowed: result[0] === 1,
      remaining: result[1],
      resetIn: windowSec
    };
  }
}