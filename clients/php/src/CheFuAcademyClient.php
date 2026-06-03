<?php

declare(strict_types=1);

namespace CheFu\Academy;

final class CheFuAcademyClient
{
    public const DEFAULT_BASE_URL = 'https://api.chefuinc.com/api';

    public function __construct(
        private ?string $apiKey = null,
        private ?string $authToken = null,
        private string $baseUrl = self::DEFAULT_BASE_URL,
        private int $timeoutSeconds = 10,
    ) {
        $this->baseUrl = rtrim($this->baseUrl, '/');
    }

    public function setAuthToken(string $token): void
    {
        $this->authToken = $token;
    }

    /** @return array<string, mixed> */
    public function login(string $email, string $password): array
    {
        $session = $this->request('POST', '/auth/login', body: [
            'email' => $email,
            'password' => $password,
        ], apiKeyAuth: false);
        $token = $session['idToken'] ?? $session['token'] ?? null;
        if (is_string($token) && $token !== '') {
            $this->setAuthToken($token);
        }
        return $session;
    }

    /** @return array<string, mixed> */
    public function register(string $email, string $password, string $fullname): array
    {
        return $this->request('POST', '/auth/register', body: [
            'email' => $email,
            'password' => $password,
            'fullname' => $fullname,
        ], apiKeyAuth: false);
    }

    /** @return array<string, mixed> */
    public function refresh(string $refreshToken): array
    {
        $session = $this->request('POST', '/auth/refresh', body: [
            'refreshToken' => $refreshToken,
        ], apiKeyAuth: false);
        $token = $session['idToken'] ?? $session['token'] ?? null;
        if (is_string($token) && $token !== '') {
            $this->setAuthToken($token);
        }
        return $session;
    }

    /** @return array<string, mixed> */
    public function listCourses(array $query = []): array
    {
        return $this->request('GET', '/courses', query: $query);
    }

    /** @return array<string, mixed> */
    public function searchCourses(array $query = []): array
    {
        return $this->request('GET', '/courses/search', query: $query);
    }

    /** @return array<string, mixed> */
    public function featuredCourses(array $query = []): array
    {
        return $this->request('GET', '/courses/featured', query: $query);
    }

    /** @return array<string, mixed> */
    public function courseCategories(): array
    {
        return $this->request('GET', '/courses/categories');
    }

    /** @return array<string, mixed> */
    public function course(string $courseId): array
    {
        return $this->request('GET', '/courses/' . rawurlencode($courseId));
    }

    /** @return array<string, mixed> */
    public function courseChapters(string $courseId): array
    {
        return $this->request('GET', '/courses/' . rawurlencode($courseId) . '/chapters');
    }

    /** @return array<string, mixed> */
    public function courseChapter(string $courseId, int $chapterIndex): array
    {
        return $this->request('GET', '/courses/' . rawurlencode($courseId) . '/chapters/' . $chapterIndex);
    }

    /** @return array<string, mixed> */
    public function courseLessons(string $courseId, int $chapterIndex): array
    {
        return $this->request('GET', '/courses/' . rawurlencode($courseId) . '/chapters/' . $chapterIndex . '/lessons');
    }

    /** @return array<string, mixed> */
    public function courseQuiz(string $courseId): array
    {
        return $this->request('GET', '/courses/' . rawurlencode($courseId) . '/quiz');
    }

    /** @return array<string, mixed> */
    public function courseFlashcards(string $courseId): array
    {
        return $this->request('GET', '/courses/' . rawurlencode($courseId) . '/flashcards');
    }

    /** @return array<string, mixed> */
    public function courseQa(string $courseId): array
    {
        return $this->request('GET', '/courses/' . rawurlencode($courseId) . '/qa');
    }

    /** @return array<string, mixed> */
    public function listVideos(array $query = []): array
    {
        return $this->request('GET', '/videos', query: $query);
    }

    /** @return array<string, mixed> */
    public function searchVideos(array $query = []): array
    {
        return $this->request('GET', '/videos/search', query: $query);
    }

    /** @return array<string, mixed> */
    public function videosByCategory(string $category): array
    {
        return $this->request('GET', '/videos/category/' . rawurlencode($category));
    }

    /** @return array<string, mixed> */
    public function video(string $videoId): array
    {
        return $this->request('GET', '/videos/' . rawurlencode($videoId));
    }

    /** @return array<string, mixed> */
    public function createKey(?string $name = null): array
    {
        return $this->request('POST', '/keys/create', body: ['name' => $name], userAuth: true, apiKeyAuth: false);
    }

    /** @return array<int, array<string, mixed>> */
    public function listKeys(): array
    {
        return $this->request('GET', '/keys/list', userAuth: true, apiKeyAuth: false);
    }

    /** @return array<string, mixed> */
    public function revokeKey(string $keyId): array
    {
        return $this->request('POST', '/keys/revoke', body: ['keyId' => $keyId], userAuth: true, apiKeyAuth: false);
    }

    /**
     * @param array<string, mixed> $query
     * @param array<string, mixed>|null $body
     * @return array<mixed>
     */
    private function request(
        string $method,
        string $path,
        array $query = [],
        ?array $body = null,
        bool $userAuth = false,
        bool $apiKeyAuth = true,
    ): array {
        $token = $userAuth ? $this->authToken : $this->apiKey;
        if ($userAuth && !$token) {
            throw new CheFuAcademyException('User authentication is required.', 401);
        }
        if ($apiKeyAuth && !$userAuth && !$token) {
            throw new CheFuAcademyException('API key is required.', 401);
        }

        $cleanQuery = array_filter($query, static fn ($value): bool => $value !== null && $value !== '');
        $url = $this->baseUrl . $path . ($cleanQuery ? '?' . http_build_query($cleanQuery) : '');
        $headers = ['Accept: application/json'];
        if ($token) {
            $headers[] = 'Authorization: Bearer ' . $token;
        }

        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeoutSeconds,
            CURLOPT_HTTPHEADER => $headers,
        ]);

        if ($body !== null) {
            $headers[] = 'Content-Type: application/json';
            curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($body, JSON_THROW_ON_ERROR));
        }

        $responseBody = curl_exec($curl);
        $statusCode = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $error = curl_error($curl);
        curl_close($curl);

        if ($responseBody === false) {
            throw new CheFuAcademyException('Network error: ' . $error);
        }

        $decoded = $responseBody === '' ? [] : json_decode($responseBody, true);
        if (!is_array($decoded)) {
            $decoded = [];
        }

        if ($statusCode < 200 || $statusCode >= 300) {
            throw new CheFuAcademyException($this->errorMessage($decoded, $responseBody), $statusCode);
        }

        return $decoded;
    }

    /** @param array<mixed> $decoded */
    private function errorMessage(array $decoded, string $raw): string
    {
        $message = $decoded['message'] ?? null;
        if (is_array($message)) {
            return implode(' ', array_map('strval', $message));
        }
        if (is_string($message) && $message !== '') {
            return $message;
        }
        $error = $decoded['error'] ?? null;
        if (is_string($error) && $error !== '') {
            return $error;
        }
        return $raw !== '' ? $raw : 'CheFu Academy request failed.';
    }
}
