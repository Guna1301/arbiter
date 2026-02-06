import express from "express";
import PolicyEngine from "../policy/PolicyEngine.js";
import LimiterFactory from "../limiter/LimiterFactory.js";
import AbuseDetector from "../abuse/AbuseDetector.js";

const router = express.Router();

export default function createDecideRoute({ store, metrics }) {
  router.post("/", async (req, res) => {
    const start = Date.now();

    const { key, rule, policy, abuse: abuseConfig } = req.body;

    if (!key || !rule || !rule.limit || !rule.window) {
      const latency = Date.now() - start;
      metrics.recordRequest(latency, false);
      return res.status(400).json({
        error: "key and rule with limit and window are required"
      });
    }

    const algorithm = rule.algorithm || "leaky-bucket";
    const whitelist = policy?.whitelist || [];
    const blacklist = policy?.blacklist || [];

    const policyEngine = new PolicyEngine({ whitelist, blacklist });
    const policyResult = policyEngine.check(key);

    if (policyResult.allowed !== null) {
      const latency = Date.now() - start;
      metrics.recordRequest(latency, policyResult.allowed);
      return res.json({
        allowed: policyResult.allowed,
        reason: policyResult.reason
      });
    }

    const limiter = LimiterFactory.create(algorithm, store);
    if (!limiter) {
      const latency = Date.now() - start;
      metrics.recordRequest(latency, false);
      return res.status(400).json({
        error: `unknown algorithm: ${algorithm}`
      });
    }

    const decision = await limiter.consume(key, rule.limit, rule.window);

    let abuseResult = { banned: false };
    if (abuseConfig) {
      const abuseDetector = new AbuseDetector(store, abuseConfig);
      abuseResult = await abuseDetector.record(key, decision.allowed);
    }

    if (abuseResult.banned) {
      const latency = Date.now() - start;
      metrics.recordRequest(latency, false);
      return res.json({
        allowed: false,
        resetIn: abuseResult.resetIn,
        reason: "abuse_detected"
      });
    }

    const latency = Date.now() - start;
    metrics.recordRequest(latency, decision.allowed);
    return res.json(decision);
  });

  return router;
}
