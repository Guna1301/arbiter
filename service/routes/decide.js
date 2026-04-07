import express from "express";
import PolicyEngine from "../policy/PolicyEngine.js";
import LimiterFactory from "../rate-limiter/limiters/LimiterFactory.js";
import AbuseDetector from "../abuse/AbuseDetector.js";


export default function createDecideRoute({ store, metrics }) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    const start = Date.now();

    try {
      const callerKey = (req.headers["x-forwarded-for"] || req.ip || "")
        .split(",")[0]
        .trim();

      const internalLimiter = LimiterFactory.create(
        INTERNAL_RULE.algorithm,
        store
      );

      const internalDecision = await internalLimiter.consume(
        `internal:${callerKey}`,
        INTERNAL_RULE.limit,
        INTERNAL_RULE.window
      );

      if (!internalDecision.allowed) {
        return res.status(429).json({
          allowed: false,
          reason: "internal_rate_limit_exceeded",
          resetIn: internalDecision.resetIn
        });
      }

      const { key, rule, policy, abuse: abuseConfig } = req.body;

      if (
        !key ||
        !rule ||
        typeof rule.limit !== "number" ||
        typeof rule.window !== "number"
      ) {
        const latency = Date.now() - start;
        metrics.recordRequest(latency, false);

        return res.status(400).json({
          allowed: false,
          error: "Invalid payload: key, rule.limit, rule.window required"
        });
      }

      const policyEngine = new PolicyEngine({
        whitelist: policy?.whitelist || [],
        blacklist: policy?.blacklist || []
      });

      const policyResult = policyEngine.check(key);

      if (policyResult.allowed !== null) {
        const latency = Date.now() - start;
        metrics.recordRequest(latency, policyResult.allowed);

        return res.json({
          allowed: policyResult.allowed,
          reason: policyResult.reason
        });
      }

      const algorithm = rule.algorithm || "leaky-bucket";

      const limiter = LimiterFactory.create(algorithm, store);

      const decision = await limiter.consume(
        key,
        rule.limit,
        rule.window
      );

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
          reason: "abuse_detected",
          resetIn: abuseResult.resetIn
        });
      }

      const latency = Date.now() - start;
      metrics.recordRequest(latency, decision.allowed);

      return res.json({
        allowed: decision.allowed,
        remaining: decision.remaining,
        resetIn: decision.resetIn
      });

    } catch (err) {
      console.error("Decide route error:", err);

      const latency = Date.now() - start;
      metrics.recordRequest(latency, false);

      return res.status(500).json({
        allowed: false,
        error: "internal_error"
      });
    }
  });

  return router;
}