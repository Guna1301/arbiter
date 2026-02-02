import ArbiterClient from "./guardClient.js";


export function createArbiterClient(config) {
    const client = new ArbiterClient();
    const defaultAlgorithm = config.defaultAlgorithm || "leaky-bucket";
    const whitelist = (config.whitelist || []).map(normalizeKey);
    const blacklist = (config.blacklist || []).map(normalizeKey);

    return {
        async protect({key, rule}){
            const ruleConfig = config.rules[rule];

            if(!ruleConfig){
                throw new Error(`Rule not found: ${rule}`);
            }

            const algorithm = ruleConfig.algorithm || defaultAlgorithm;

            return client.decide({
                key: normalizeKey(key),
                rule:{
                    limit: ruleConfig.limit,
                    window: ruleConfig.window,
                    algorithm,
                },
                policy:{
                    whitelist,
                    blacklist
                }
            });
        }
    };
}

function normalizeKey(key) {
  if (typeof key === "string" && key.startsWith("::ffff:")) {
    return key.replace("::ffff:", "");
  }
  return key;
}