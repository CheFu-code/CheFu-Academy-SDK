// CheFu-Academy-sdk/src/auth.ts

import { CheFuAcademyClient, CheFuAcademyError } from './client';

export interface LoginResponse {
    token: string;
    user: {
        id: string;
        email: string;
        fullname: string;
    };
}

export interface RegisterResponse {
    message: string;
    user: {
        id: string;
        email: string;
        fullname: string;
    };
}

export class Auth {
    private client: CheFuAcademyClient;

    constructor(client: CheFuAcademyClient) {
        this.client = client;
    }

    /**
     * Login user
     */
    async login(email: string, password: string): Promise<LoginResponse> {
        if (!email || !password) {
            throw new CheFuAcademyError(
                'Email and password are required.',
                422,
            );
        }

        try {
            return await this.client.post<LoginResponse>('/auth/login', {
                email,
                password,
            });
        } catch (error: any) {
            this.handleAuthError(error, 'login');
        }
    }

    /**
     * Register user
     */
    async register(
        email: string,
        password: string,
        fullname: string,
    ): Promise<RegisterResponse> {
        if (!email) {
            throw new CheFuAcademyError(
                'Email is required.',
                422,
            );
        }
        if (!password) {
            throw new CheFuAcademyError(
                'Password is required.',
                422,
            );
        }
        if (!fullname) {
            throw new CheFuAcademyError(
                'Full name is required.',
                422,
            );
        }

        if (password.length < 6) {
            throw new CheFuAcademyError(
                'Password must be at least 6 characters long.',
                422,
            );
        }

        try {
            return await this.client.post<RegisterResponse>(
                '/auth/register',
                { email, password, fullname },
            );
        } catch (error: any) {
            this.handleAuthError(error, 'register');
        }
    }

    /**
     * Auth-specific error mapping
     */
    private handleAuthError(error: CheFuAcademyError, action: 'login' | 'register'): never {
        if (error instanceof CheFuAcademyError) {
            switch (error.statusCode) {
                case 401:
                    throw new CheFuAcademyError(
                        'Invalid email or password.',
                        401,
                    );

                case 409:
                    throw new CheFuAcademyError(
                        'An account with this email already exists.',
                        409,
                    );

                case 422:
                    throw new CheFuAcademyError(
                        'Invalid input. Please check your details.',
                        422,
                        error.details,
                    );

                case 429:
                    throw new CheFuAcademyError(
                        'Too many attempts. Please try again later.',
                        429,
                    );

                default:
                    throw new CheFuAcademyError(
                        `Failed to ${action}. Please try again.`,
                        error.statusCode,
                        error.details,
                    );
            }
        }

        throw new CheFuAcademyError(
            `Unexpected error during ${action}.`,
        );
    }
}
