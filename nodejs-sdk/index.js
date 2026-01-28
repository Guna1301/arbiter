import ArbiterClient from "./guardClient.js";


export function createArbiterClient(config) {
    const client = new ArbiterClient();
    const algorithm = config.algorithm || "leaky-bucket";
    const whitelist = config.whitelist || [];
    const blacklist = config.blacklist || [];

    return {
        async protect({key, rule}){
            const ruleConfig = config.rules[rule];

            if(!ruleConfig){
                throw new Error(`Rule not found: ${rule}`);
            }

            const normalizedKey = normalizeKey(key);

            return client.decide({
                key: normalizedKey,
                limit: ruleConfig.limit,
                window: ruleConfig.window,
                algorithm: algorithm,
                whitelist: whitelist,
                blacklist: blacklist
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