import StorageAdapter from "./StorageAdapter.js";

export default class MemoryStore extends StorageAdapter{
    constructor(){
        super();
        this.store = new Map();
    }

    async get(key){
        return this.store.get(key);
    }

    async set(key, value, ttlSec){
        this.store.set(key, value);

        if(ttlSec){
            setTimeout(()=>{
                this.store.delete(key);
            }, ttlSec * 1000);
        }
    }
}