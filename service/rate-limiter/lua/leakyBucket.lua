-- KEYS[1] = bucket key
-- ARGV[1] = capacity
-- ARGV[2] = window (seconds)
-- ARGV[3] = now (ms)

local data = redis.call("GET", KEYS[1])

local level
local lastLeak

if data then
  local decoded = cjson.decode(data)
  if decoded.level and decoded.lastLeak then
    level = decoded.level
    lastLeak = decoded.lastLeak
  else
    level = 0
    lastLeak = tonumber(ARGV[3])
  end
else
  level = 0
  lastLeak = tonumber(ARGV[3])
end

local now = tonumber(ARGV[3])
local window = tonumber(ARGV[2])
local capacity = tonumber(ARGV[1])

local leakRate = capacity / window
local elapsed = math.max(0, (now - lastLeak) / 1000)
local leaked = elapsed * leakRate

level = math.max(0, level - leaked)
lastLeak = now

local allowed = 0
if level < capacity then
  level = level + 1
  allowed = 1
end

local remaining = math.floor(math.max(0, capacity - level))
local resetIn = math.ceil(level / leakRate)
local ttl = math.ceil(window * 2)

redis.call("SET", KEYS[1], cjson.encode({
  level = level,
  lastLeak = lastLeak
}), "EX", ttl)

return { allowed, remaining, resetIn }
