// CheFu-Academy-sdk/src/courses.ts

import { CheFuAcademyClient, CheFuAcademyError } from './client';

/**
 * Course types
 */
export interface Course {
    id: string;
    title: string;
    description: string;
    bannerImage?: string;
    category?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CourseListResponse {
    courses: Course[];
    total: number;
}

/**
 * Courses API wrapper
 */
export class Courses {
    private client: CheFuAcademyClient;

    constructor(client: CheFuAcademyClient) {
        this.client = client;
    }

    /**
     * Get all courses
     */
    async getAll(): Promise<CourseListResponse> {
        try {
            return await this.client.get<CourseListResponse>('/courses');
        } catch (error: any) {
            this.handleCourseError(error, 'fetch course');
        }
    }

    /**
     * Get a single course by ID
     */
    async getById(courseId: string): Promise<Course> {
        if (!courseId) {
            throw new CheFuAcademyError(
                'Course ID is required.',
                422,
            );
        }

        try {
            return await this.client.get<Course>(
                `/courses/${courseId}`,
            );
        } catch (error: any) {
            this.handleCourseError(error, 'fetch course');
        }
    }

    /**
     * Centralized course error handler
     */
    private handleCourseError(error: CheFuAcademyError | any, action: string): never {
        if (error instanceof CheFuAcademyError) {
            const message = error.details?.message || error.message || `Failed to ${action}.`;
            switch (error.statusCode) {
                case 401:
                    throw new CheFuAcademyError(`Unauthorized: ${message}`, 401, error.details);
                case 404:
                    throw new CheFuAcademyError(`Course not found: ${message}`, 404, error.details);
                case 429:
                    throw new CheFuAcademyError(`Rate limit exceeded while trying to ${action}: ${message}`, 429, error.details);
                default:
                    throw new CheFuAcademyError(`Failed to ${action}: ${message}`, error.statusCode, error.details);
            }
        }

        // For unexpected errors not wrapped by the SDK
        throw new CheFuAcademyError(
            `Unexpected error while trying to ${action}: ${error?.message || 'Unknown error'}`,
            error?.statusCode,
            error?.details
        );
    }

}
