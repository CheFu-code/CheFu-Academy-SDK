import { CheFuAcademyClient, CheFuAcademyError } from './client';

export interface Video {
    id: string;
    source?: 'uploaded' | 'youtube';
    videoId?: string;
    youtubeVideoId?: string;
    title?: string;
    instructorCompany?: string;
    instructorName?: string;
    description?: string;
    videoURL?: string;
    embedURL?: string;
    thumbnailURL?: string;
    uploadedBy?: string;
    uploadedAt?: unknown;
    category?: string;
    visibility?: 'public' | 'private' | string;
    level?: string;
    duration?: number;
    views?: number;
    topics?: string[];
    [key: string]: unknown;
}

export interface VideoListOptions {
    query?: string;
    category?: string;
    limit?: number;
}

export interface VideoListResponse {
    videos: Video[];
    total: number;
}

export class Videos {
    private client: CheFuAcademyClient;

    constructor(client: CheFuAcademyClient) {
        this.client = client;
    }

    async getAll(options: VideoListOptions = {}): Promise<VideoListResponse> {
        return this.getVideoList('/videos', options, 'fetch videos');
    }

    async getById(videoId: string): Promise<Video> {
        if (!videoId) {
            throw new CheFuAcademyError('Video ID is required.', 422);
        }

        try {
            return await this.client.get<Video>(
                `/videos/${encodeURIComponent(videoId)}`,
            );
        } catch (error: unknown) {
            this.handleVideoError(error, 'fetch video by ID');
        }
    }

    async search(options: VideoListOptions): Promise<VideoListResponse> {
        return this.getVideoList('/videos/search', options, 'search videos');
    }

    async getByCategory(category: string): Promise<VideoListResponse> {
        if (!category) {
            throw new CheFuAcademyError('Video category is required.', 422);
        }

        return this.getVideoList(
            `/videos/category/${encodeURIComponent(category)}`,
            {},
            'fetch videos by category',
        );
    }

    private async getVideoList(
        path: string,
        options: VideoListOptions,
        action: string,
    ) {
        try {
            return await this.client.get<VideoListResponse>(
                this.withQuery(path, options),
            );
        } catch (error: unknown) {
            this.handleVideoError(error, action);
        }
    }

    private withQuery(path: string, options: VideoListOptions = {}) {
        const params = new URLSearchParams();

        Object.entries(options).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') return;
            params.set(key, String(value));
        });

        const query = params.toString();
        return query ? `${path}?${query}` : path;
    }

    private handleVideoError(error: unknown, action: string): never {
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
