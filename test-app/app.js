import express from "express";
import { createArbiterClient } from "arbiter-sdk";


const app = express();

const arbiter = createArbiterClient({
  defaultAlgorithm: "leaky-bucket",
  whitelist: ["admin_1", "127.0.0.1"],
  blacklist: ["banned_user", "127.0.0.2"],
  abuse: {
    threshold: 5,
    banTime: 120
  },
  rules: {
    login: {
      limit: 3,
      window: 10,
      algorithm: "leaky-bucket",
      policy: {
        whitelist: ["admin_login_ip"],
        blacklist: ["127.0.0.3"]
      },

      abuse: {
        threshold: 2,
        banTime: 300
      }
    },
    search: {
      limit: 20,
      window: 60
    }
  }
});

app.get("/login", async (req, res) => {
    console.log(`Incoming request from IP: ${req.ip}`);
  const decision = await arbiter.protect({
    key: req.ip,
    rule: "login"
  });

  if (!decision.allowed) {
    return res.status(429).json(decision);
  }

  res.json({ message: "Login allowed", decision });
});

app.listen(5000, () => {
  console.log("Demo app running at http://localhost:5000/login");
});
