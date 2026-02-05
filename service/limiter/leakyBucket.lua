-- KEYS[1] = bucket key
-- ARGV[1] = capacity
-- ARGV[2] = window (seconds)
-- ARGV[3] = now (ms)

local data = redis.call("GET", KEYS[1])
local tokens
local last

if data then
  local decoded = cjson.decode(data)
  tokens = decoded.tokens
  last = decoded.last
else
  tokens = tonumber(ARGV[1])
  last = tonumber(ARGV[3])
end

local now = tonumber(ARGV[3])
local window = tonumber(ARGV[2])
local capacity = tonumber(ARGV[1])

local leakRate = capacity / window
local elapsed = (now - last) / 1000
local leaked = math.floor(elapsed * leakRate)

tokens = math.max(0, tokens - leaked)
last = now

local allowed = 0
if tokens > 0 then
  tokens = tokens - 1
  allowed = 1
end

local ttl = math.ceil(window)
redis.call("SET", KEYS[1], cjson.encode({ tokens = tokens, last = last }), "EX", ttl)

return { allowed, tokens }
