import express from "express";
import "dotenv/config";
import { createArbiterClient } from "arbiter-sdk";

const apiKey = process.env.ARBITER_API_KEY;

if (!apiKey) {
  throw new Error(
    "ARBITER_API_KEY is required. Create a test-app/.env file with an active Arbiter API key."
  );
}

const app = express();
const port = Number(process.env.PORT || 5000);

const arbiter = createArbiterClient({
  apiKey,
  defaultAlgorithm: "leaky-bucket",
  whitelist: ["admin_1"],
  blacklist: ["banned_user"],
  rules: {
    login: {
      limit: 3,
      window: 10,
      algorithm: "leaky-bucket",
      abuse: {
        threshold: 2,
        banTime: 60
      }
    },
    search: {
      limit: 5,
      window: 10,
      algorithm: "token-bucket"
    }
  }
});

function clientKey(req) {
  return req.get("x-demo-key") || req.ip;
}

async function protect(req, rule) {
  return arbiter.protect({
    key: clientKey(req),
    rule
  });
}

function sendDecision(res, decision, allowedMessage) {
  if (!decision.allowed) {
    return res.status(429).json({
      message: "Request blocked by Arbiter",
      decision
    });
  }

  return res.json({
    message: allowedMessage,
    decision
  });
}

app.get("/", (req, res) => {
  res.json({
    name: "Arbiter demo application",
    endpoints: {
      login: "GET /login",
      search: "GET /search",
      admin: "GET /admin",
      health: "GET /health"
    },
    clientKeyHeader: "x-demo-key"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/login", async (req, res, next) => {
  try {
    const decision = await protect(req, "login");
    return sendDecision(res, decision, "Login request allowed");
  } catch (error) {
    return next(error);
  }
});

app.get("/search", async (req, res, next) => {
  try {
    const decision = await protect(req, "search");
    return sendDecision(res, decision, "Search request allowed");
  } catch (error) {
    return next(error);
  }
});

app.get("/admin", async (req, res, next) => {
  try {
    const decision = await protect(req, "login");
    return sendDecision(res, decision, "Admin request allowed");
  } catch (error) {
    return next(error);
  }
});

app.use((error, req, res, next) => {
  console.error("Demo application error:", error);
  res.status(502).json({
    message: "Arbiter decision unavailable",
    error: error.message
  });
});

app.listen(port, () => {
  console.log(`Arbiter demo app running at http://localhost:${port}`);
  console.log("Try: npm run load-test");
});
