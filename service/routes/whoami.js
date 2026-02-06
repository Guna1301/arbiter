import os from 'os';
import express from 'express';

const router = express.Router();

export default function createWhoamiRoute() {
    router.get("/", (req, res) => {
        const hostname = os.hostname();
        res.json({hostname, timestamp: Date.now(), service:"arbiter"});
    })
}
