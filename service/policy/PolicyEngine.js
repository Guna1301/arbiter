export default class PolicyEngine {
    constructor({whitelist=[], blacklist=[]}){
        this.whitelist = new Set(whitelist);
        this.blacklist = new Set(blacklist);
    }

    check(key){
        if(this.whitelist.has(key)){
            return {
                allowed: true,
                reason: "whitelisted"
            }
        }

        if(this.blacklist.has(key)){
            return {
                allowed: false,
                reason: "blacklisted"
            }
        }

        return {
            allowed: null,
            reason: "neutral"
        }
    }
}