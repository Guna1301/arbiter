import StorageAdapter from "./StorageAdapter.js";

export default class RedisStore extends StorageAdapter {
  constructor(redisClient) {
    super();
    this.client = redisClient;
  }

  async get(key) {
    if (!key) return null;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key, value, ttlSec) {
    if (!key) {
      throw new Error("RedisStore.set called with empty key");
    }

    const data = JSON.stringify(value);

    if (ttlSec) {
      await this.client.set(key, data, { EX: ttlSec });
    } else {
      await this.client.set(key, data);
    }
  }
}
