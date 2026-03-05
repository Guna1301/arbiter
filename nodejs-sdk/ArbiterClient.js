import axios from "axios";
import { ENDPOINTS } from "./endpoints.js";

export default class ArbiterClient {

  constructor() {

    this.timeout = 2000;

    this.primary = ENDPOINTS.primary;
    this.secondary = ENDPOINTS.secondary;

    this.primaryClient = axios.create({
      baseURL: this.primary,
      timeout: this.timeout
    });

    if (this.secondary) {
      this.secondaryClient = axios.create({
        baseURL: this.secondary,
        timeout: this.timeout
      });
    }

  }

  async decide(payload) {

    try {

      const res = await this.primaryClient.post(
        "/decide",
        payload
      );

      return res.data;

    } catch (err) {

      if (!this.secondaryClient) {
        throw err;
      }

      try {

        const res = await this.secondaryClient.post(
          "/decide",
          payload
        );

        return res.data;

      } catch (error) {

        throw new Error(
          "Arbiter decision engine unavailable (primary + secondary failed)"
        );

      }

    }

  }

}