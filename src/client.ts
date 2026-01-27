// CheFu-Academy-sdk/src/client.ts

import axios, { AxiosError, AxiosInstance } from 'axios';

export interface CheFuAcademyConfig {
    apiKey: string;
    baseURL?: string;
    timeout?: number;
}

/**
 * Custom SDK Error
 */
export class CheFuAcademyError extends Error {
    statusCode?: number;
    details?: any;

    constructor(message: string, statusCode?: number, details?: any) {
        super(message);
        this.name = 'CheFuAcademyError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

export class CheFuAcademyClient {
    private apiKey: string;
    private baseURL: string;
    private client: AxiosInstance;

    constructor(config: CheFuAcademyConfig) {
        if (!config.apiKey) {
            throw new CheFuAcademyError(
                '[CheFu Academy SDK] API key is required',
                401,
            );
        }

        this.apiKey = config.apiKey;
        this.baseURL = config.baseURL || 'https://chefu-academy-sdk.onrender.com/api';

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: config.timeout || 10000, // 10s timeout
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    /**
     * Axios response & error interceptors
     */
    private setupInterceptors() {
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                throw this.handleError(error);
            },
        );
    }

    /**
     * Centralized error handler
     */
    private handleError(error: AxiosError): CheFuAcademyError {
        // Network error (no response)
        if (!error.response) {
            return new CheFuAcademyError(
                'Network error. Please check your internet connection.',
            );
        }

        const { status, data } = error.response as any;

        switch (status) {
            case 400:
                return new CheFuAcademyError(
                    data?.message || 'Bad request.',
                    400,
                    data,
                );

            case 401:
                return new CheFuAcademyError(
                    'Invalid or expired API key.',
                    401,
                );

            case 403:
                return new CheFuAcademyError(
                    'You do not have permission to perform this action.',
                    403,
                );

            case 404:
                return new CheFuAcademyError(
                    'Requested resource not found.',
                    404,
                );

            case 429:
                return new CheFuAcademyError(
                    'Rate limit exceeded. Please slow down your requests.',
                    429,
                );

            case 500:
                return new CheFuAcademyError(
                    'CheFu Academy server error. Please try again later.',
                    500,
                );

            default:
                return new CheFuAcademyError(
                    data?.message || 'Unexpected error occurred.',
                    status,
                    data,
                );
        }
    }

    private logRequest(method: string, url: string, data?: any) {
        if (process.env.CHEFU_SDK_DEBUG === "true") {
            console.log(`[CheFu SDK] ${method.toUpperCase()} ${url}`, data || '');
        }
    }

    /**
     * HTTP GET
     */
    async get<T = any>(path: string): Promise<T> {
        const res = await this.client.get(path);
        return res.data;
    }

    /**
     * HTTP POST
     */
    async post<T = any>(path: string, data?: any): Promise<T> {
        const res = await this.client.post(path, data);
        return res.data;
    }

    async put<T = any>(path: string, data?: any): Promise<T> {
        const res = await this.client.put(path, data);
        return res.data;
    }

    async delete<T = any>(path: string): Promise<T> {
        const res = await this.client.delete(path);
        return res.data;
    }

}
