import StorageAdapter from "./StorageAdapter.js";

export default class RedisStore extends StorageAdapter {
  constructor(redisClient) {
    super();
    this.client = redisClient;
  }

  async get(key) {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key, value, ttlSec) {
    if (ttlSec) {
      await this.client.set(key, JSON.stringify(value), "EX", ttlSec);
    } else {
      await this.client.set(key, JSON.stringify(value));
    }
  }
}
