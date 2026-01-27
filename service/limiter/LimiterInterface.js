export default class LimiterInterface {
    async consume(key, limit, windowSec){
        throw new Error('consume is Not implemented');
    }
}