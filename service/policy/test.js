import PolicyEngine from "./PolicyEngine.js";

const policy = new PolicyEngine({
  whitelist: ["127.0.0.1"],
  blacklist: ["1.2.3.4"]
});

console.log(policy.check("127.0.0.1"));
console.log(policy.check("1.2.3.4"));
console.log(policy.check("9.9.9.9"));
