// CheFu-Academy-sdk/src/client.ts

import axios from "axios";

export interface CheFuConfig {
    apiKey: string;
    baseURL?: string;
}

export class CheFuClient {
    apiKey: string;
    baseURL: string;

    constructor(config: CheFuConfig) {
        this.apiKey = config.apiKey;
        this.baseURL = config.baseURL || "https://api.chefuacademy.com/api";

        if (!this.apiKey) {
            throw new Error("[CheFuAcademy]: API key is required");
        }
    }
    post(path: string, data?: any) {
        return axios.post(`${this.baseURL}${path}`, data, {
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
            },
        });
    }

    get(path: string) {
        return axios.get(`${this.baseURL}${path}`, {
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
            },
        });
    }
}
