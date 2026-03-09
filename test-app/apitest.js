import { createArbiterClient } from "../nodejs-sdk/index.js";

const arbiter = createArbiterClient({
  apiKey: "arb_live_f7c3eaa2c6756c6c3bea6cd256bbcdc98fba10f856cd9833"
});

await arbiter.init();

for (let i = 0; i < 5; i++) {

  const result = await arbiter.protect({
    key: "192.168.1.10",
    rule: "login"
  });

  console.log(result);

}