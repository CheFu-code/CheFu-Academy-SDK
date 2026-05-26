import { CheFuAcademyClient, CheFuAcademyError } from './client';

export interface CreateApiKeyOptions {
    name?: string;
}

export interface CreateApiKeyResponse {
    apiKey: string;
    publicId: string;
    warning: string;
}

export interface ApiKeySummary {
    id: string;
    publicId?: string;
    prefix?: string;
    name: string;
    active: boolean;
    plan: string;
    createdAt?: unknown;
    lastUsedAt?: unknown;
    [key: string]: unknown;
}

export interface RevokeApiKeyResponse {
    success: boolean;
}

export class Keys {
    private client: CheFuAcademyClient;

    constructor(client: CheFuAcademyClient) {
        this.client = client;
    }

    async create(
        options: CreateApiKeyOptions = {},
    ): Promise<CreateApiKeyResponse> {
        try {
            return await this.client.postWithUserAuth<CreateApiKeyResponse>(
                '/keys/create',
                { name: options.name },
            );
        } catch (error: unknown) {
            this.handleKeyError(error, 'create API key');
        }
    }

    async list(): Promise<ApiKeySummary[]> {
        try {
            return await this.client.getWithUserAuth<ApiKeySummary[]>('/keys/list');
        } catch (error: unknown) {
            this.handleKeyError(error, 'list API keys');
        }
    }

    async revoke(keyId: string): Promise<RevokeApiKeyResponse> {
        if (!keyId) {
            throw new CheFuAcademyError('API key ID is required.', 422);
        }

        try {
            return await this.client.postWithUserAuth<RevokeApiKeyResponse>(
                '/keys/revoke',
                { keyId },
            );
        } catch (error: unknown) {
            this.handleKeyError(error, 'revoke API key');
        }
    }

    private handleKeyError(error: unknown, action: string): never {
        if (error instanceof CheFuAcademyError) {
            throw new CheFuAcademyError(
                `Failed to ${action}: ${error.message}`,
                error.statusCode,
                error.details,
            );
        }

        throw new CheFuAcademyError(`Unexpected error while trying to ${action}.`);
    }
}
