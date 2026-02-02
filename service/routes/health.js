import express from 'express';
const router = express.Router();

export default function createHealthRoute() {
    router.get("/", (req, res) => {
        res.json({status: "ok", timestamp: Date.now(), service:"arbiter"});
    });
    return router;
}