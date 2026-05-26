// src/index.ts

import { Auth } from './auth';
import { CheFuAcademyClient } from './client';
import { Courses } from './courses';
import { Keys } from './keys';
import { Videos } from './videos';
import type { CheFuAcademyConfig } from './client';

export type {
    LoginResponse,
    RegisterResponse,
    TerminalLoginOptions,
} from './auth';
export {
    CheFuAcademyClient,
    CheFuAcademyError,
    type CheFuAcademyConfig,
} from './client';
export type {
    Chapter,
    ChapterContentItem,
    Course,
    CourseListOptions,
    CourseListResponse,
    FeaturedCourseOptions,
    Flashcard,
    QA,
    Quiz,
} from './courses';
export type {
    ApiKeySummary,
    CreateApiKeyOptions,
    CreateApiKeyResponse,
    RevokeApiKeyResponse,
} from './keys';
export type { Video, VideoListOptions, VideoListResponse } from './videos';

/**
 * Main CheFu Academy SDK
 */
export class CheFuAcademy {
    readonly auth: Auth;
    readonly courses: Courses;
    readonly videos: Videos;
    readonly keys: Keys;
    readonly client: CheFuAcademyClient;

    constructor(config: CheFuAcademyConfig) {
        if (!config) {
            throw new Error('[CheFu Academy SDK] Configuration object is required.');
        }

        this.client = new CheFuAcademyClient(config);

        this.auth = new Auth(this.client);
        this.courses = new Courses(this.client);
        this.videos = new Videos(this.client);
        this.keys = new Keys(this.client);
    }
}

export default CheFuAcademy;
