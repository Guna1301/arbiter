import ArbiterClient from "./ArbiterClient.js";
import axios from "axios";

const analyticsQueue = [];

const GATEWAYS = [
  "http://localhost:5000"
];

export function createArbiterClient(config) {

  if (!config.apiKey) {
    throw new Error("apiKey is required");
  }

  const client = new ArbiterClient(config.apiKey);

  let cloudConfig = null;
  let version = null;


  async function fetchConfig() {

    for (const gateway of GATEWAYS) {

      try {

        const res = await axios.get(
          `${gateway}/gateway/config`,
          {
            headers: {
              "x-api-key": config.apiKey
            },
            timeout: 2000
          }
        );

        cloudConfig = res.data;
        version = res.data.version;

        return;

      } catch (err) {
        continue;
      }

    }

    throw new Error("All Arbiter gateways unavailable");

  }

  async function refreshConfig() {

    for (const gateway of GATEWAYS) {

      try {

        const res = await axios.get(
          `${gateway}/gateway/config`,
          {
            headers: {
              "x-api-key": config.apiKey
            },
            timeout: 2000
          }
        );

        if (res.data.version !== version) {
          cloudConfig = res.data;
          version = res.data.version;
        }

        return;

      } catch (err) {
        continue;
      }

    }

  }


  setInterval(refreshConfig, 60000);


  setInterval(async () => {

    if (analyticsQueue.length === 0) return;

    const batch = analyticsQueue.splice(0, analyticsQueue.length);

    try {
      await axios.post(
        `${GATEWAYS[0]}/gateway/event/batch`,
        {events: batch},
        {
          headers: {
            "x-api-key": config.apiKey
          }
        }
      )
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
        algorithm: ruleConfig.algorithm || global.algorithm
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

function normalizeKey(key) {

  if (typeof key === "string" && key.startsWith("::ffff:")) {
    return key.replace("::ffff:", "");
  }

  return key;

}