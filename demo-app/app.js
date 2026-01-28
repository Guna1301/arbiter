import express from 'express';
import dotenv from 'dotenv';

import {createArbiterClient} from "../nodejs-sdk/index.js"

dotenv.config();

const app = express();
const ab = createArbiterClient({
    rules:{
        login:{
            limit: 3,
            window: 10
        }
    }
});

app.get("/login", async(req,res)=>{
    const decision = await ab.protect({
        key: req.ip,
        rule: "login"
    });
    if(!decision.allowed){
        return res.status(429).json(decision);
    }

    res.json({message: "login successful"});
})


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Try accessing http://localhost:${PORT}/login`);
});