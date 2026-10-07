const baseUrl = process.env.DEMO_URL || "http://localhost:5000";
const demoKey = process.env.DEMO_KEY || "demo-client";
const endpoint = process.argv[2] || "/login";
const count = Number(process.argv[3] || 8);

if (!endpoint.startsWith("/")) {
  throw new Error("Endpoint must start with '/', for example /login or /search");
}

console.log(`Calling ${endpoint} ${count} times as ${demoKey}...`);

for (let requestNumber = 1; requestNumber <= count; requestNumber += 1) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      "x-demo-key": demoKey
    }
  });

  const body = await response.json();
  console.log(
    `${requestNumber}: HTTP ${response.status} | allowed=${body.decision?.allowed ?? "n/a"} | remaining=${body.decision?.remaining ?? "n/a"} | reason=${body.decision?.reason ?? "none"}`
  );
}
