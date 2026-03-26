import { createArbiterClient } from "../nodejs-sdk/index.js";

const arbiter = createArbiterClient({
  apiKey: "arb_live_9d12b2511d0236742d379e9e69b074ec5af0d5585b78ceaa24af6a839019510a",
  rules: {
    login: {
      limit: 5
    }
  }
});

async function runTest() {

  await arbiter.init();

  console.log("Testing Arbiter...\n");

  for (let i = 1; i <= 10; i++) {

    const result = await arbiter.protect({
      key: "192.168.1.10",
      rule: "login"
    });

    console.log(`Request ${i}:`, result);

  }

}

runTest();