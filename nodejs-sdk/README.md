# Arbiter Node.js SDK

Official Node.js SDK for **Arbiter**, a developer-first traffic protection and request decision engine.

Arbiter helps backend systems **decide whether a request should be allowed or blocked** based on configurable rules such as rate limits, abuse detection, and access policies.


## What is Arbiter?

Arbiter is **not just a rate limiter**.

It is a **decision layer** that sits in front of your APIs and answers one question fast and reliably:

> **“Should this request be allowed right now?”**

You can use Arbiter to:
- Protect APIs from abuse
- Control burst traffic
- Enforce per-user or per-key limits
- Apply dynamic policies (blacklist / whitelist)
- Build your own traffic rules on top


## Key Features

- **Rate limiting**
  - Fixed window & burst-friendly logic
- **Abuse protection**
  - Threshold-based temporary bans
- **Policy controls**
  - Whitelist & blacklist support
- **Developer-first API**
  - Simple request -> decision model
- **Lightweight & fast**
  - Minimal overhead, small bundle size
- **Redis-friendly**
  - Designed for distributed systems
- **Framework-agnostic**
  - Works with Express, Fastify, NestJS, or plain Node.js


## Installation

```bash
npm install arbiter-sdk
```
## Core Concept

Arbiter works on a **decision model**.

You send:
- A **key** (user, IP, token, API key, etc.)
- A **rule** (limits, window)
- Rules are defined at startup and referenced by name at request time.
- Optional **policies** (whitelist / blacklist)
- Optional **abuse configuration**

Arbiter returns:
- `allowed: true | false`
- Metadata explaining **why** the decision was made


## Basic Usage

Create an Arbiter client with named rules, then protect routes by referencing the rule name.

```js
import { createArbiterClient } from "arbiter-sdk";

const arbiter = createArbiterClient({
  defaultAlgorithm: "leaky-bucket", // optional
  whitelist: [],
  blacklist: [],
  rules: {
    login: { limit: 3, window: 10 }
  }
});

app.get("/login", async (req, res) => {
  const decision = await arbiter.protect({
    key: req.ip,
    rule: "login"
  });

  if (!decision.allowed) {
    return res.status(429).json(decision);
  }

  res.json({ message: "Login allowed", decision });
});
```
## Full Configuration Example

Arbiter is configured once at startup using **global defaults** and **named rules**.  
Each rule can optionally override global settings such as algorithm, policies, and abuse protection.

```js
const arbiter = createArbiterClient({
  /* =========================
     Global Configuration
     ========================= */

  // Default algorithm for all rules
  defaultAlgorithm: "leaky-bucket",

  // Global whitelist / blacklist
  // Applied if a rule does not define its own policy
  whitelist: ["admin_1", "127.0.0.1"],
  blacklist: ["banned_user", "127.0.0.2"],

  // Global abuse protection
  // Applied if a rule does not define its own abuse config
  abuse: {
    threshold: 5,
    banTime: 120
  },

  /* =========================
     Rule Definitions
     ========================= */

  rules: {
    login: {
      // Rate limit configuration
      limit: 3,
      window: 10,

      // Optional algorithm override for this rule
      algorithm: "leaky-bucket",

      // Optional rule-level policy overrides
      policy: {
        whitelist: ["admin_login_ip"],
        blacklist: ["blocked_login_ip"]
      },

      // Optional rule-level abuse override
      abuse: {
        threshold: 2,
        banTime: 300
      }
    },

    search: {
      limit: 20,
      window: 60
      // Uses global algorithm, policy, and abuse config
    }
  }
});

```

## Configuration Breakdown

### Client Configuration (`createArbiterClient`)

| Field | Type | Description |
|------|------|------------|
| `defaultAlgorithm` *(optional)* | `string` | Default traffic control algorithm (e.g. `leaky-bucket`) |
| `rules` | `object` | Collection of named rules |
| `rules.<name>.limit` | `number` | Maximum requests allowed for the rule |
| `rules.<name>.window` | `number` | Time window in seconds |
| `rules.<name>.algorithm` *(optional)* | `string` | Algorithm override for this rule |
| `rules.<name>.policy.whitelist` *(optional)* | `string[]` | Keys that bypass this specific rule |
| `rules.<name>.policy.blacklist` *(optional)* | `string[]` | Keys blocked for this specific rule |
| `rules.<name>.abuse` *(optional)* | `object` | Abuse configuration override for this rule |
| `whitelist` | `string[]` | Keys that bypass **all** rules |
| `blacklist` | `string[]` | Keys that are always blocked |
| `abuse.threshold` | `number` | Violations before a temporary ban |
| `abuse.banTime` | `number` | Temporary ban duration (seconds) |

> **Precedence rule:**  
> Rule-level configuration always overrides global configuration.

---

### Request Protection (`arbiter.protect`)

This method is called **per request**.

| Field | Type | Description |
|------|------|------------|
| `key` | `string` | Unique identifier (IP, userId, token, etc.) |
| `rule` | `string` | Name of the rule to apply |

**Example:**
```js
await arbiter.protect({
  key: req.ip,
  rule: "login"
});
```
### Decision Response

Returned by `arbiter.protect`.

| Field | Type | Description |
|------|------|------------|
| `allowed` | `boolean` | Whether the request is allowed |
| `remaining` | `number` | Remaining requests in the window |
| `resetIn` | `number` | Seconds until the limit resets |
| `reason` | `string` | Reason for blocking (if blocked) |

## Express Middleware Example (Boilerplate)

```js
app.use(async (req, res, next) => {
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

  next();
});
```

## Where Arbiter Fits in Your Architecture

- API Gateway protection  
- Microservices traffic control  
- Public APIs & SaaS backends  
- Internal service-to-service throttling  

Arbiter is designed to be:
- **Stateless at the SDK level**
- **Stateful in Redis**
- **Safe for horizontal scaling**


## Why Arbiter Instead of Traditional Rate Limiters?

**Traditional rate limiters:**
- Run inside a single application instance
- Rely on in-memory counters
- Break or become inconsistent when scaled horizontally
- Are tightly coupled to framework middleware

**Arbiter:**
- Runs as a **separate decision service**
- Designed to operate in a **distributed server setup**
- Can be deployed across **multiple containers or instances**
- Uses **Redis as shared state** for consistency
- Works behind load balancers such as **NGINX**
- Provides consistent decisions regardless of which instance handles the request

### Distributed Architecture Example

- Multiple Arbiter service instances
- Load balanced via NGINX
- Redis used for centralized state management

Because all Arbiter instances share state through Redis, rate limits and abuse rules are enforced **consistently across the entire system**, not per container.

This makes Arbiter suitable for:
- Horizontally scaled backends
- Microservices architectures
- High-traffic production environments
