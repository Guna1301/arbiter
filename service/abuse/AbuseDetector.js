export default class AbuseDetector {
    constructor(store, options={}){
        this.store = store;
        this.threshold = options.threshold || 5;
        this.banTime = options.banTime || 60;
    }

    async record(key, allowed){
        const abuseKey = `abuse:${key}`;

        let state = await this.store.get(abuseKey);

        if(!state){
            state = {fails:0, banUntil:0};
        }

        const now = Date.now();

        if(state.banUntil > now){
            return {
                banned: true,
                resetIn: Math.ceil((state.banUntil - now)/1000)
            };
        }

        if(!allowed){
            state.fails += 1;

            if(state.fails >= this.threshold){
                state.banUntil = now + this.banTime * 1000;
                state.fails = 0;
            }
        }else{
            state.fails = 0;
        }

        await this.store.set(abuseKey, state, this.banTime);

        if(state.banUntil > now){
            return {
                banned: true,
                resetIn: this.banTime
            };
        }

        return {
            banned: false
        };
    }
}