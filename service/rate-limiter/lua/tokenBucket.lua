-- KEYS[1] = bucket key
-- ARGV[1] = capacity
-- ARGV[2] = window (seconds)
-- ARGV[3] = now (ms)

local data = redis.call("GET", KEYS[1])

local tokens
local lastRefill

if data then
  local decoded = cjson.decode(data)
  tokens = decoded.tokens
  lastRefill = decoded.lastRefill
else
  tokens = tonumber(ARGV[1])
  lastRefill = tonumber(ARGV[3])
end

local capacity = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local refillRate = capacity / window
local elapsed = (now - lastRefill) / 1000
local refill = elapsed * refillRate

tokens = math.min(capacity, tokens + refill)
lastRefill = now

local allowed = 0

if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end

local ttl = math.ceil(window * 2)

redis.call("SET", KEYS[1], cjson.encode({
  tokens = tokens,
  lastRefill = lastRefill
}), "EX", ttl)

return { allowed, math.floor(tokens) }