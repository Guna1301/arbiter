import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const script = fs.readFileSync(
  path.join(__dirname, "leakyBucket.lua"),
  "utf8"
);

export default class LeakyBucketLimiter {
  constructor(store) {
    this.store = store;
    this.script = script;
  }

  async consume(key, limit, window) {
    const now = Date.now();

    const result = await this.store.client.eval(this.script, {
      keys: [key],
      arguments: [
        String(limit),
        String(window),
        String(now)
      ]
    });

    const allowed = result[0] === 1;
    const remaining = result[1];
    const resetIn = window;

    return { allowed, remaining, resetIn };
  }
}
