# Arbiter demo application

This small Express app shows how an application uses the Arbiter SDK before
handling protected routes.

## Setup

Node.js 18 or newer is required.

```powershell
Copy-Item .env.example .env
```

Set `ARBITER_API_KEY` in `.env` to an active API key from the Arbiter web
dashboard. The configured project must contain rules named `login` and
`search`; the values in `app.js` are local overrides.

Install and start the app:

```powershell
npm install
npm start
```

## Try the protected routes

```powershell
curl http://localhost:5000
curl http://localhost:5000/login
curl http://localhost:5000/search
curl -H "x-demo-key: admin_1" http://localhost:5000/login
curl -H "x-demo-key: banned_user" http://localhost:5000/login
```

The `x-demo-key` header identifies the caller for the rate limiter. If it is
not supplied, the app uses the caller IP address.

## Demonstrate rate limiting

In another terminal:

```powershell
npm run load-test
npm run load-test:search
node apitest.js /login 8
```

The login rule uses Leaky Bucket and temporary abuse bans. The search rule
uses Token Bucket and allows a short burst up to its configured capacity.

The application returns HTTP `200` for allowed decisions and HTTP `429` for
blocked decisions. The response includes Arbiter's `allowed`, `remaining`,
`resetIn`, and `reason` fields.
