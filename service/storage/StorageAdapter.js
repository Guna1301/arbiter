export default class StorageAdapter {
    async get(key){
        throw new Error('get() Method not implemented');
    }

    async set(key, value, ttlSec){
        throw new Error('set() Method not implemented');
    }
}