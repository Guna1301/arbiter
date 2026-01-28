import express from "express";
import { createArbiterClient } from "../nodejs-sdk/index.js";

const app = express();

const arbiter = createArbiterClient({
  algorithm: "leaky-bucket",
  whitelist: [],
  blacklist: ["127.0.0.1"],
  rules: {
    login: { limit: 3, window: 10 }
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
