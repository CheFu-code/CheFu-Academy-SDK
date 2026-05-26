// src/index.ts

import { Auth } from './auth';
import { CheFuAcademyClient } from './client';
import { Courses } from './courses';
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
export type { Course, CourseListResponse } from './courses';

/**
 * Main CheFu Academy SDK
 */
export class CheFuAcademy {
    readonly auth: Auth;
    readonly courses: Courses;
    readonly client: CheFuAcademyClient;

    constructor(config: CheFuAcademyConfig) {
        if (!config) {
            throw new Error('[CheFu Academy SDK] Configuration object is required.');
        }

        this.client = new CheFuAcademyClient(config);

        this.auth = new Auth(this.client);
        this.courses = new Courses(this.client);
    }
}

export default CheFuAcademy;
