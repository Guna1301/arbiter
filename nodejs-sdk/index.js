import ArbiterClient from "./ArbiterClient.js";

export function createArbiterClient(config) {
    const client = new ArbiterClient();
    const defaultAlgorithm = config.defaultAlgorithm || "leaky-bucket";
    const globalWhitelist = (config.whitelist || []).map(normalizeKey);
    const globalBlacklist = (config.blacklist || []).map(normalizeKey);
    const globalAbuse = config.abuse || null;

    return {
        async protect({key, rule}){
            const ruleConfig = config.rules[rule];

            if(!ruleConfig){
                throw new Error(`Rule not found: ${rule}`);
            }

            const algorithm = ruleConfig.algorithm || defaultAlgorithm;

            const policy = {
                whitelist: (ruleConfig.policy?.whitelist || globalWhitelist).map(normalizeKey),
                blacklist: (ruleConfig.policy?.blacklist || globalBlacklist).map(normalizeKey),
            }

            const abuse = ruleConfig.abuse || globalAbuse;

            return client.decide({
                key: normalizeKey(key),
                rule:{
                    limit: ruleConfig.limit,
                    window: ruleConfig.window,
                    algorithm,
                },
                policy,
                abuse
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