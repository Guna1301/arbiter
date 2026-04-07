# Arbiter Node.js SDK

Official Node.js SDK for **Arbiter**, a distributed API protection platform.

Arbiter helps your backend decide:

> Should this request be allowed right now?

It provides rate limiting, abuse detection, and traffic control using a **cloud-managed configuration + lightweight SDK**.



## What is Arbiter?

Arbiter is not just a rate limiter.

It is a **centralized decision system** where:

- Rules are managed in the dashboard (cloud)
- SDK enforces those rules in your backend
- Decisions are made using a distributed system (Redis-backed)



## How it works

1. You create a project in the Arbiter dashboard  
2. Define rules (rate limits, policies, abuse detection)  
3. Generate an API key  
4. SDK uses this API key to fetch configuration  
5. Each request is validated → allow or block  



## Installation

```bash
npm install arbiter-sdk
```



## Quick Start

```js
import { createArbiterClient } from "arbiter-sdk";

const arbiter = createArbiterClient({
  apiKey: process.env.ARBITER_API_KEY
});

await arbiter.init();

app.post("/login", async (req, res) => {
  const decision = await arbiter.protect({
    key: req.ip,
    rule: "login"
  });

  if (!decision.allowed) {
    return res.status(429).json({
      message: "Too many requests",
      decision
    });
  }

  res.json({ message: "Login allowed" });
});
```



## Core Concept

Arbiter follows a **request → decision model**.

You provide:

- `key` → identifies the client (IP, user ID, token)
- `rule` → name of the rule defined in the dashboard

Arbiter returns:

- whether the request is allowed  
- metadata about the decision  



## Cloud + Override Model

Arbiter uses a hybrid approach:

- **Cloud config (default)** → managed in dashboard  
- **Local overrides (optional)** → defined in SDK  

Example:

```js
const arbiter = createArbiterClient({
  apiKey: process.env.ARBITER_API_KEY,

  rules: {
    login: {
      limit: 10 // overrides cloud config
    }
  }
});
```

This allows:

- Central control without redeploys  
- Flexibility when needed  



## Request Protection

```js
await arbiter.protect({
  key: req.ip,
  rule: "login"
});
```



## Decision Response

```json
{
  "allowed": true,
  "remaining": 2,
  "resetIn": 8,
  "reason": null
}
```



## Where Arbiter Fits

- Login / authentication endpoints  
- Public APIs  
- Payment routes  
- Microservices  



## Why Arbiter?

Traditional rate limiters:

- Hardcoded configuration  
- No centralized control  
- No analytics  
- Break in distributed systems  

Arbiter:

- Centralized dashboard control  
- Distributed decision system  
- Redis-backed consistency  
- SDK-based integration  
- Real-time analytics  



## Learn More

- Documentation: https://docs-arbiter.vercel.app/
- Rate limiting deep dive: https://dev.to/guna01/rate-limiting-concepts-algorithms-and-distributed-challenges-4gfl



## License

MIT