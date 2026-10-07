import { ENDPOINTS } from "./endpoints.js";
import { requestJson } from "./http.js";

export default class ArbiterClient {

  constructor(apiKey) {
    this.apiKey = apiKey;
    this.timeout = 2000;

    this.primary = ENDPOINTS.primary;
    this.secondary = ENDPOINTS.secondary;

  }

  async decide(payload) {

    try {

      return await this.requestDecision(this.primary, payload);

    } catch (err) {

      if (!this.secondary) {
        throw err;
      }

      try {

        return await this.requestDecision(this.secondary, payload);

      } catch (error) {

        throw new Error(
          "Arbiter decision engine unavailable (primary + secondary failed)"
        );

      }

    }

  }

  async requestDecision(endpoint, payload) {
    return requestJson(`${endpoint}/decide`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey
      },
      body: JSON.stringify(payload)
    }, this.timeout);
  }

}