import axios from "axios";
import { ENDPOINTS } from "./endpoints.js";

export default class ArbiterClient{
    constructor(){
        this.timeout = 2000;
        this.primary = ENDPOINTS.primary;
        this.secondary = ENDPOINTS.secondary;

        this.primaryClient = axios.create({
            baseURL: this.primary,
            timeout: this.timeout,
        });

        this.secondaryClient = axios.create({
            baseURL: this.secondary,
            timeout: this.timeout,
        });
    }

    async decide(payload){
        try {
            const res = await this.primaryClient.post("/decide", payload);
            return res.data;
        } catch (error) {
            if(!this.secondary){
                throw error;
            }

            try {
                const res = await this.secondaryClient.post("/decide", payload);
                return res.data;
            }catch (error) {
                throw new Error("Both primary and secondary endpoints failed");
            }
            
        }
    }
}