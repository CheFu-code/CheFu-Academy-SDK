import { CheFuAcademyClient, CheFuAcademyError } from './client';

export interface Flashcard {
    front?: string;
    back?: string;
    [key: string]: unknown;
}

export interface ChapterContentItem {
    topic?: string;
    explain?: string;
    code?: string;
    example?: string;
    [key: string]: unknown;
}

export interface Chapter {
    chapterName?: string;
    content?: ChapterContentItem[];
    [key: string]: unknown;
}

export interface QA {
    question?: string;
    answer?: string;
    [key: string]: unknown;
}

export interface Quiz {
    question?: string;
    options?: string[];
    correctAns?: string;
    [key: string]: unknown;
}

export interface Course {
    id: string;
    courseTitle?: string;
    title?: string;
    description?: string;
    banner_image?: string;
    bannerImage?: string;
    category?: string;
    chapters?: Chapter[];
    quiz?: Quiz[];
    flashcards?: Flashcard[];
    qa?: QA[];
    averageRating?: number;
    reviewCount?: number;
    [key: string]: unknown;
}

export interface CourseListOptions {
    query?: string;
    category?: string;
    limit?: number;
}

export interface FeaturedCourseOptions {
    limit?: number;
}

export interface CourseListResponse {
    courses: Course[];
    total: number;
}

type CategoriesResponse = {
    categories: string[];
    total: number;
};

type ChaptersResponse = {
    courseId: string;
    chapters: Chapter[];
};

type ChapterResponse = {
    courseId: string;
    chapterIndex: number;
    chapter: Chapter;
};

type LessonsResponse = {
    courseId: string;
    chapterIndex: number;
    lessons: ChapterContentItem[];
};

type QuizResponse = {
    courseId: string;
    quiz: Quiz[];
};

type FlashcardsResponse = {
    courseId: string;
    flashcards: Flashcard[];
};

type QAResponse = {
    courseId: string;
    qa: QA[];
};

export class Courses {
    private client: CheFuAcademyClient;

    constructor(client: CheFuAcademyClient) {
        this.client = client;
    }

    async getAll(options: CourseListOptions = {}): Promise<CourseListResponse> {
        return this.getCourseList('/courses', options, 'fetch courses');
    }

    async search(options: CourseListOptions): Promise<CourseListResponse> {
        return this.getCourseList('/courses/search', options, 'search courses');
    }

    async getFeatured(
        options: FeaturedCourseOptions = {},
    ): Promise<CourseListResponse> {
        return this.getCourseList(
            '/courses/featured',
            options,
            'fetch featured courses',
        );
    }

    async getCategories(): Promise<string[]> {
        try {
            const response = await this.client.get<CategoriesResponse>(
                '/courses/categories',
            );
            return response.categories;
        } catch (error: unknown) {
            this.handleCourseError(error, 'fetch course categories');
        }
    }

    async getById(courseId: string): Promise<Course> {
        this.assertCourseId(courseId);

        try {
            return await this.client.get<Course>(
                `/courses/${encodeURIComponent(courseId)}`,
            );
        } catch (error: unknown) {
            this.handleCourseError(error, 'fetch course by ID');
        }
    }

    async getChapters(courseId: string): Promise<Chapter[]> {
        this.assertCourseId(courseId);

        try {
            const response = await this.client.get<ChaptersResponse>(
                `/courses/${encodeURIComponent(courseId)}/chapters`,
            );
            return response.chapters;
        } catch (error: unknown) {
            this.handleCourseError(error, 'fetch course chapters');
        }
    }

    async getChapter(
        courseId: string,
        chapterIndex: number,
    ): Promise<Chapter> {
        this.assertCourseId(courseId);
        this.assertIndex(chapterIndex, 'Chapter');

        try {
            const response = await this.client.get<ChapterResponse>(
                `/courses/${encodeURIComponent(courseId)}/chapters/${chapterIndex}`,
            );
            return response.chapter;
        } catch (error: unknown) {
            this.handleCourseError(error, 'fetch course chapter');
        }
    }

    async getLessons(
        courseId: string,
        chapterIndex: number,
    ): Promise<ChapterContentItem[]> {
        this.assertCourseId(courseId);
        this.assertIndex(chapterIndex, 'Chapter');

        try {
            const response = await this.client.get<LessonsResponse>(
                `/courses/${encodeURIComponent(courseId)}/chapters/${chapterIndex}/lessons`,
            );
            return response.lessons;
        } catch (error: unknown) {
            this.handleCourseError(error, 'fetch course lessons');
        }
    }

    async getQuiz(courseId: string): Promise<Quiz[]> {
        this.assertCourseId(courseId);

        try {
            const response = await this.client.get<QuizResponse>(
                `/courses/${encodeURIComponent(courseId)}/quiz`,
            );
            return response.quiz;
        } catch (error: unknown) {
            this.handleCourseError(error, 'fetch course quiz');
        }
    }

    async getFlashcards(courseId: string): Promise<Flashcard[]> {
        this.assertCourseId(courseId);

        try {
            const response = await this.client.get<FlashcardsResponse>(
                `/courses/${encodeURIComponent(courseId)}/flashcards`,
            );
            return response.flashcards;
        } catch (error: unknown) {
            this.handleCourseError(error, 'fetch course flashcards');
        }
    }

    async getQA(courseId: string): Promise<QA[]> {
        this.assertCourseId(courseId);

        try {
            const response = await this.client.get<QAResponse>(
                `/courses/${encodeURIComponent(courseId)}/qa`,
            );
            return response.qa;
        } catch (error: unknown) {
            this.handleCourseError(error, 'fetch course Q&A');
        }
    }

    private async getCourseList(
        path: string,
        options: CourseListOptions | FeaturedCourseOptions,
        action: string,
    ) {
        try {
            return await this.client.get<CourseListResponse>(
                this.withQuery(path, options),
            );
        } catch (error: unknown) {
            this.handleCourseError(error, action);
        }
    }

    private withQuery(
        path: string,
        options: CourseListOptions | FeaturedCourseOptions = {},
    ) {
        const params = new URLSearchParams();

        Object.entries(options).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') return;
            params.set(key, String(value));
        });

        const query = params.toString();
        return query ? `${path}?${query}` : path;
    }

    private assertCourseId(courseId: string) {
        if (!courseId) {
            throw new CheFuAcademyError('Course ID is required.', 422);
        }
    }

    private assertIndex(index: number, label: string) {
        if (!Number.isInteger(index) || index < 0) {
            throw new CheFuAcademyError(`${label} index must be 0 or greater.`, 422);
        }
    }

    private handleCourseError(error: unknown, action: string): never {
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
