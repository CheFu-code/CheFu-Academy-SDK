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
            this.handleCourseError(error, 'fetch courses');
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
                `/courses/view/${courseId}`,
            );
        } catch (error: any) {
            this.handleCourseError(error, 'fetch course');
        }
    }

    /**
     * Centralized course error handler
     */
    private handleCourseError(
        error: CheFuAcademyError,
        action: string,
    ): never {
        if (error instanceof CheFuAcademyError) {
            switch (error.statusCode) {
                case 401:
                    throw new CheFuAcademyError(
                        'Unauthorized. Please check your API key.',
                        401,
                    );

                case 404:
                    throw new CheFuAcademyError(
                        'Course not found.',
                        404,
                    );

                case 429:
                    throw new CheFuAcademyError(
                        'Rate limit exceeded while trying to ' + action + '.',
                        429,
                    );

                default:
                    throw new CheFuAcademyError(
                        `Failed to ${action}.`,
                        error.statusCode,
                        error.details,
                    );
            }
        }

        throw new CheFuAcademyError(
            `Unexpected error while trying to ${action}.`,
        );
    }
}
