import ArbiterClient from "./ArbiterClient.js";
import axios from "axios";

const GATEWAYS = [
  "http://localhost:5000"
];

export function createArbiterClient(config) {

  const client = new ArbiterClient();

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

  if (config.apiKey) {
    setInterval(refreshConfig, 60000);
  }

  return {
    async init() {

      if (config.apiKey) {
        await fetchConfig();
      }

    },
    async protect({ key, rule }) {

      // if api then cloud mode
      if (config.apiKey) {

        if (!cloudConfig) {
          await fetchConfig();
        }

        const ruleConfig = cloudConfig.rules[rule];

        if (!ruleConfig) {
          throw new Error(`Rule not found: ${rule}`);
        }

        const global = cloudConfig.global;

        const result = await client.decide({
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

        try {

          await axios.post(
            `${GATEWAYS[0]}/gateway/event`,
            {
              rule,
              key,
              allowed: result.allowed
            },
            {
              headers: {
                "x-api-key": config.apiKey
              }
            }
          );

        } catch (err) {
          
        }

        return result;

      }

      // else local mode
      const defaultAlgorithm =
        config.defaultAlgorithm || "leaky-bucket";

      const globalWhitelist =
        (config.whitelist || []).map(normalizeKey);

      const globalBlacklist =
        (config.blacklist || []).map(normalizeKey);

      const globalAbuse = config.abuse || null;

      const ruleConfig = config.rules[rule];

      if (!ruleConfig) {
        throw new Error(`Rule not found: ${rule}`);
      }

      const algorithm =
        ruleConfig.algorithm || defaultAlgorithm;

      const policy = {
        whitelist: (ruleConfig.policy?.whitelist || globalWhitelist)
          .map(normalizeKey),

        blacklist: (ruleConfig.policy?.blacklist || globalBlacklist)
          .map(normalizeKey)
      };

      const abuse =
        ruleConfig.abuse || globalAbuse;

      return client.decide({
        key: normalizeKey(key),
        rule: {
          limit: ruleConfig.limit,
          window: ruleConfig.window,
          algorithm
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