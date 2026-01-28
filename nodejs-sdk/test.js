import { createArbiterClient } from "./index.js";

const ab = createArbiterClient({
    rules:{
        login:{
            limit: 5,
            window: 10
        }
    }
});

for(let i=0;i<10;i++){
    const res = await ab.protect({key: "user1", rule: "login"});
    console.log(res);
    await new Promise(r => setTimeout(r, 500));
}