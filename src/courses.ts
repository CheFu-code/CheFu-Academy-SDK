// CheFu-Academy-sdk/src/courses.ts

import { CheFuAcademyClient, CheFuAcademyError } from './client';


/**
 * Represents a course in CheFu Academy.
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

/**
 * Response for a list of courses.
 */
export interface CourseListResponse {
    courses: Course[];
    total: number;
}

/**
 * Courses API wrapper for CheFu Academy.
 * Provides methods to interact with course resources.
 */
export class Courses {
    private client: CheFuAcademyClient;

    /**
     * Creates a new Courses API wrapper.
     * @param client CheFuAcademyClient instance
     */
    constructor(client: CheFuAcademyClient) {
        this.client = client;
    }

    /**
     * Get all courses.
     * @returns A promise resolving to a list of courses and total count.
     * @throws CheFuAcademyError on failure.
     */
    async getAll(): Promise<CourseListResponse> {
        try {
            return await this.client.get<CourseListResponse>('/courses');
        } catch (error: any) {
            this.handleCourseError(error, 'fetch course');
        }
    }

    /**
     * Get a single course by ID.
     * @param courseId The ID of the course to fetch.
     * @returns A promise resolving to the course.
     * @throws CheFuAcademyError if courseId is missing or on failure.
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
            this.handleCourseError(error, 'fetch course by ID');
        }
    }

    /**
     * Create a new course (stub).
     * @param course Partial course data.
     * @returns Promise resolving to the created course.
     */
    async create(course: Partial<Course>): Promise<Course> {
        // Implementation placeholder
        throw new CheFuAcademyError('Not implemented', 501);
    }

    /**
     * Update an existing course (stub).
     * @param courseId The ID of the course to update.
     * @param updates Partial course data to update.
     * @returns Promise resolving to the updated course.
     */
    async update(courseId: string, updates: Partial<Course>): Promise<Course> {
        // Implementation placeholder
        throw new CheFuAcademyError('Not implemented', 501);
    }

    /**
     * Delete a course (stub).
     * @param courseId The ID of the course to delete.
     * @returns Promise resolving to void.
     */
    async delete(courseId: string): Promise<void> {
        // Implementation placeholder
        throw new CheFuAcademyError('Not implemented', 501);
    }

    /**
     * Centralized course error handler.
     * @param error The error thrown.
     * @param action The action being performed.
     * @throws CheFuAcademyError
     */
    private handleCourseError(error: CheFuAcademyError | any, action: string): never {
        if (error instanceof CheFuAcademyError) {
            const message = error?.details?.message ?? error?.message ?? `Failed to ${action}.`;
            const statusCode = error?.statusCode ?? 500;
            const details = error?.details ?? {};
            switch (statusCode) {
                case 401:
                    throw new CheFuAcademyError(`Unauthorized: ${message}`, 401, details);
                case 404:
                    throw new CheFuAcademyError(`Course not found: ${message}`, 404, details);
                case 429:
                    throw new CheFuAcademyError(`Rate limit exceeded while trying to ${action}: ${message}`, 429, details);
                default:
                    throw new CheFuAcademyError(`Failed to ${action}: ${message}`, statusCode, details);
            }
        }

        // For unexpected errors not wrapped by the SDK
        throw new CheFuAcademyError(
            `Unexpected error while trying to ${action}: ${error?.message ?? 'Unknown error'}`,
            error?.statusCode ?? 500,
            error?.details ?? {}
        );
    }
}
