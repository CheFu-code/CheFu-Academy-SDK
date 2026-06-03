// CheFu-Academy-sdk/src/client.ts
import axios, {
    AxiosError,
    AxiosInstance,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';

export interface CheFuAcademyConfig {
    apiKey?: string;
    authToken?: string;
    baseURL?: string;
    timeout?: number;
}

type ApiErrorBody = {
    message?: string | string[];
    error?: string;
    [key: string]: unknown;
};

const DEFAULT_BASE_URL = 'https://api.chefuinc.com/api';

/**
 * Custom SDK Error
 */
export class CheFuAcademyError extends Error {
    statusCode?: number;
    // keep `details` flexible, but avoid `any`
    details?: unknown;

    constructor(message: string, statusCode?: number, details?: unknown) {
        super(message);
        this.name = 'CheFuAcademyError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

export class CheFuAcademyClient {
    private apiKey?: string;
    private authToken?: string;
    private baseURL: string;
    private client: AxiosInstance;

    constructor(config: CheFuAcademyConfig) {
        this.apiKey = config.apiKey;
        this.authToken = config.authToken;
        this.baseURL = config.baseURL ?? DEFAULT_BASE_URL;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.apiKey) {
            headers.Authorization = `Bearer ${this.apiKey}`;
        }

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: config.timeout ?? 10_000, // 10s timeout
            headers,
        });

        this.setupInterceptors();
    }

    setAuthToken(token: string) {
        this.authToken = token;
    }

    clearAuthToken() {
        this.authToken = undefined;
    }

    /**
     * Axios response & error interceptors
     */
    private setupInterceptors() {
        // (Optional) If you also want to log or mutate requests later:
        // this.client.interceptors.request.use(
        //   (request: InternalAxiosRequestConfig) => request,
        //   (error: AxiosError) => Promise.reject(error)
        // );

        this.client.interceptors.response.use(
            // ✅ Explicitly type `response` to fix "implicitly has an 'any' type"
            (response: AxiosResponse) => response,
            (error: AxiosError<ApiErrorBody>) => {
                // Return a rejected promise to follow Axios interceptor contract
                return Promise.reject(this.handleError(error));
            }
        );
    }

    /**
     * Centralized error handler
     */
    private handleError(error: AxiosError<ApiErrorBody>): CheFuAcademyError {
        // Network error (no response)
        if (!error.response) {
            return new CheFuAcademyError(
                'Network error. Please check your internet connection.'
            );
        }

        const { status, data } = error.response;

        switch (status) {
            case 400:
                return new CheFuAcademyError(
                    this.errorMessage(data) ?? 'Bad request.',
                    400,
                    data
                );
            case 401:
                return new CheFuAcademyError('Invalid or expired API key.', 401);
            case 403:
                return new CheFuAcademyError(
                    'You do not have permission to perform this action.',
                    403
                );
            case 404:
                return new CheFuAcademyError('Requested resource not found.', 404);
            case 429:
                return new CheFuAcademyError(
                    'Rate limit exceeded. Please slow down your requests.',
                    429
                );
            case 500:
                return new CheFuAcademyError(
                    'CheFu Academy server error. Please try again later.',
                    500
                );
            default:
                return new CheFuAcademyError(
                    this.errorMessage(data) ?? 'Unexpected error occurred.',
                    status,
                    data
                );
        }
    }

    private errorMessage(data?: ApiErrorBody) {
        if (!data) return undefined;
        if (Array.isArray(data.message)) return data.message.join(' ');
        if (data.message) return data.message;
        return data.error;
    }

    private isSensitiveKey(key: string): boolean {
        const normalized = key.toLowerCase();
        return [
            'password',
            'pass',
            'pwd',
            'token',
            'idtoken',
            'refreshtoken',
            'authtoken',
            'apikey',
            'authorization',
            'secret',
        ].includes(normalized);
    }

    private redactSensitiveData(value: unknown): unknown {
        if (Array.isArray(value)) {
            return value.map((item) => this.redactSensitiveData(item));
        }

        if (value && typeof value === 'object') {
            const redacted: Record<string, unknown> = {};
            for (const [key, nestedValue] of Object.entries(
                value as Record<string, unknown>,
            )) {
                redacted[key] = this.isSensitiveKey(key)
                    ? '[REDACTED]'
                    : this.redactSensitiveData(nestedValue);
            }
            return redacted;
        }

        return value;
    }

    private logRequest(method: string, url: string, data?: unknown) {
        if (process.env.CHEFU_SDK_DEBUG === 'true') {
            const safeData = data === undefined ? '' : this.redactSensitiveData(data);
            // eslint-disable-next-line no-console
            console.log(`[CheFu SDK] ${method.toUpperCase()} ${url}`, safeData);
        }
    }

    /**
     * HTTP GET
     */
    async get<T = unknown>(path: string): Promise<T> {
        this.logRequest('get', path);
        const res: AxiosResponse<T> = await this.client.get<T>(path);
        return res.data;
    }

    /**
     * HTTP POST
     */
    async post<T = unknown>(path: string, data?: unknown): Promise<T> {
        this.logRequest('post', path, data);
        const res: AxiosResponse<T> = await this.client.post<T>(path, data);
        return res.data;
    }

    async getWithUserAuth<T = unknown>(path: string): Promise<T> {
        this.logRequest('get', path);
        const res: AxiosResponse<T> = await this.client.get<T>(path, {
            headers: this.userAuthHeaders(),
        });
        return res.data;
    }

    async postWithUserAuth<T = unknown>(
        path: string,
        data?: unknown,
    ): Promise<T> {
        this.logRequest('post', path, data);
        const res: AxiosResponse<T> = await this.client.post<T>(path, data, {
            headers: this.userAuthHeaders(),
        });
        return res.data;
    }

    /**
     * HTTP PUT
     */
    async put<T = unknown>(path: string, data?: unknown): Promise<T> {
        this.logRequest('put', path, data);
        const res: AxiosResponse<T> = await this.client.put<T>(path, data);
        return res.data;
    }

    /**
     * HTTP DELETE
     */
    async delete<T = unknown>(path: string): Promise<T> {
        this.logRequest('delete', path);
        const res: AxiosResponse<T> = await this.client.delete<T>(path);
        return res.data;
    }

    private userAuthHeaders() {
        if (!this.authToken) {
            throw new CheFuAcademyError(
                'User authentication is required. Login first or pass authToken in the SDK config.',
                401,
            );
        }

        return {
            Authorization: `Bearer ${this.authToken}`,
        };
    }
}
