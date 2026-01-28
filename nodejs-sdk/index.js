import ArbiterClient from "./guardClient.js";


export function createArbiterClient(config) {
    const client = new ArbiterClient();

    return {
        async protect({key, rule}){
            const ruleConfig = config.rules[rule];

            if(!ruleConfig){
                throw new Error(`Rule not found: ${rule}`);
            }

            return client.decide({
                key,
                limit: ruleConfig.limit,
                window: ruleConfig.window
            });
        }
    };
}