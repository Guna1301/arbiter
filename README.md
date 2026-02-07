# Arbiter

Developer-first, distributed traffic protection service for backend APIs.

Arbiter provides rate limiting, abuse detection, and policy enforcement as a distributed service with an official Node.js SDK.


## What is Arbiter?

Arbiter is a language-agnostic traffic protection service designed to protect backend APIs from abuse and excessive traffic.

It offers:
- Rate limiting using Leaky Bucket and Token Bucket algorithms
- Rule-based traffic policies
- Abuse detection with temporary bans
- Whitelist and blacklist enforcement
- Horizontal scalability with shared Redis state

Arbiter is exposed via an HTTP API and ships with an official Node.js SDK for seamless integration.


## Why Arbiter?

Most rate-limiting solutions are embedded directly inside application code,
making them hard to scale, share, or keep consistent across services.

Arbiter externalizes traffic protection into a dedicated, distributed service
so multiple APIs can enforce consistent policies without duplicating logic or state.


## Features

- Rate Limiting
  - Leaky Bucket (default, smoother traffic shaping)
  - Token Bucket (optional, burst-friendly)
- Rule-based limits per endpoint
- Abuse detection with configurable thresholds
- IP-based whitelist and blacklist
- SDK-level multi-cloud failover
- Fully containerized and horizontally scalable



## Architecture
```
Client Request
    ↓
User API (Express / Fastify / etc.)
    ↓
(Pre-handler / Middleware)
    ↓
Arbiter Node.js SDK
    ↓
Nginx Load Balancer
    ↓
Multiple Arbiter Service Instances (Docker)
    ↓
Redis (Shared State)

```

## Key Design Choices

- Stateless service instances
- Shared Redis-backed state
- Atomic rate limiting using Redis Lua scripts
- SDK-level failover across multiple deployments



## Node.js SDK Usage

```js
import { createArbiterClient } from "arbiter-sdk";

const arbiter = createArbiterClient({
  rules: {
    login: { limit: 5, window: 60 }
  }
});

app.post("/login", async (req, res) => {
  const decision = await arbiter.protect({
    key: req.ip,
    rule: "login"
  });

  if (!decision.allowed) {
    return res.status(429).json(decision);
  }

  res.json({ success: true });
});
```
- For additional usage examples, see `test-app`

---


## Benchmarks

The system was benchmarked on AWS EC2 behind an Nginx load balancer with three service instances and shared Redis.

- Sustained throughput: ~1,000 requests/sec
- Arbiter service latency: ~200 ms under sustained load
- Correct rate limiting under worst-case contention
- No race conditions or double-allowing observed

Benchmarks were performed using `autocannon` with concurrent clients and pipelined requests.

---

## Deployment

- Arbiter Service:
  - Dockerized Node.js service
  - Deployed on AWS EC2 behind Nginx
  - Secondary deployment on Render

- Redis:
  - External Redis service (Upstash)

- SDK:
  - Published to npm as `arbiter-sdk`
  - Automatic failover between Render and AWS


## Failure Handling

- SDK maintains multiple Arbiter endpoints
- Automatic failover on timeout or 5xx responses
- Configurable fail-open or fail-closed behavior


## Design Decisions

- Chose Redis + Lua for atomic rate limiting
- Used stateless service instances for horizontal scaling
- Implemented SDK-level failover to hide infrastructure complexity
- Prioritized correctness and consistency over raw throughput in adversarial traffic scenarios


## Non-goals

- Arbiter is not an API gateway
- It does not perform authentication or authorization
- It does not inspect or modify request payloads


## License
This project is licensed under the MIT License. See the LICENSE file for details.

