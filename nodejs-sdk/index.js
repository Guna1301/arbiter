import ArbiterClient from "./ArbiterClient.js";
import { ENDPOINTS } from "./endpoints.js";
import { requestJson } from "./http.js";

const analyticsQueue = [];

export function createArbiterClient(config) {

  if (!config.apiKey) {
    throw new Error("apiKey is required");
  }

  const client = new ArbiterClient(config.apiKey);

  let cloudConfig = null;
  let version = null;


  async function fetchConfig() {

    try {
      const res = await requestJson(`${ENDPOINTS.gateway}/gateway/config`, {
        headers: {
          "x-api-key": config.apiKey
        }
      });

      cloudConfig = res;
      version = res.version;
      return;
    } catch (err) {
      throw new Error("Arbiter gateway unavailable", { cause: err });
    }
  }

  async function refreshConfig() {

    try {
      const res = await requestJson(`${ENDPOINTS.gateway}/gateway/config`, {
        headers: {
          "x-api-key": config.apiKey
        }
      });

      if (res.version !== version) {
        cloudConfig = res;
        version = res.version;
      }
    } catch (err) {
      console.error("Arbiter gateway config refresh failed:", err);
    }
  }


  setInterval(refreshConfig, 60000);


  setInterval(async () => {

    if (analyticsQueue.length === 0) return;

    const batch = analyticsQueue.splice(0, analyticsQueue.length);

    try {
      await requestJson(`${ENDPOINTS.gateway}/gateway/event/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey
        },
        body: JSON.stringify({ events: batch })
      });
    } catch (error) {
      
    }

  }, 2000);


  function mergeConfig(cloud, local) {

    if (!local) return cloud;

    return {
      global: {
        algorithm: local.defaultAlgorithm || cloud.global.algorithm,
        whitelist: local.whitelist || cloud.global.whitelist,
        blacklist: local.blacklist || cloud.global.blacklist,
        abuse: local.abuse || cloud.global.abuse
      },

      rules: {
        ...cloud.rules,
        ...Object.fromEntries(
          Object.entries(local.rules || {}).map(([key, value]) => [
            key,
            {
              ...cloud.rules[key],
              ...value
            }
          ])
        )
      }
    };

  }

  async function executeDecision({ key, ruleConfig, global }) {

    return client.decide({
      key: normalizeKey(key),
      rule: {
        limit: ruleConfig.limit,
        window: ruleConfig.window,
        algorithm: normalizeAlgorithm(
          ruleConfig.algorithm || global.algorithm
        )
      },
      policy: {
        whitelist: ruleConfig.policy?.whitelist || global.whitelist,
        blacklist: ruleConfig.policy?.blacklist || global.blacklist
      },
      abuse: ruleConfig.abuse || global.abuse
    });

  }

  return {

    async init() {
      await fetchConfig();
    },

    async protect({ key, rule }) {

      if (!cloudConfig) {
        await fetchConfig();
      }

      const finalConfig = mergeConfig(cloudConfig, config);

      const ruleConfig = finalConfig.rules[rule];

      if (!ruleConfig) {
        throw new Error(`Rule not found: ${rule}`);
      }

      const global = finalConfig.global;

      const result = await executeDecision({
        key,
        ruleConfig,
        global
      });

      analyticsQueue.push({
        rule,
        key,
        allowed: result.allowed
      });

      return result;

    }

  };

}

function normalizeAlgorithm(algorithm) {
  if (algorithm === "token_bucket") return "token-bucket";
  if (algorithm === "leaky_bucket") return "leaky-bucket";
  return algorithm;
}

function normalizeKey(key) {

  if (typeof key === "string" && key.startsWith("::ffff:")) {
    return key.replace("::ffff:", "");
  }

  return key;

}