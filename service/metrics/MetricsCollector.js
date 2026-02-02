export default class MetricsCollector {
  constructor() {
    this.totalRequests = 0;
    this.blockedRequests = 0;
    this.totalLatencyMs = 0;
  }

  recordRequest(latencyMs, allowed) {
    this.totalRequests += 1;
    this.totalLatencyMs += latencyMs;

    if (!allowed) {
      this.blockedRequests += 1;
    }
  }

  snapshot() {
    const avgLatencyMs =
      this.totalRequests === 0
        ? 0
        : this.totalLatencyMs / this.totalRequests;

    return {
      totalRequests: this.totalRequests,
      blockedRequests: this.blockedRequests,
      avgLatencyMs: Number(avgLatencyMs.toFixed(2))
    };
  }
}
