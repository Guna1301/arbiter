import express from "express";

const router = express.Router();

export default function createMetricsRoute(metrics) {
  router.get("/", (req, res) => {
    res.json(metrics.snapshot());
  });

  return router;
}
