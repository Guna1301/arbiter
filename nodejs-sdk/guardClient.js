import axios from "axios";

export default class ArbiterClient{
    constructor(){
        const baseUrl = process.env.ARBITER_URL || "http://localhost:4000";

        this.client = axios.create({
            baseURL: baseUrl,
            timeout: 2000,
        })
    }

    async decide(payload){
        const response = await this.client.post("/decide", payload);
        return response.data;
    }
}