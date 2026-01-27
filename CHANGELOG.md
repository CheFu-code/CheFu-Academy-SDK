# Changelog

All notable changes to this project will be documented in this file.

## [1.0.2] - 2026-01-23

### Added

- Improved CheFuClient with centralized error handling and status codes
- Auth module with login and register methods
- Courses module with getAll and getById, fully typed
- SDK entry point exposing auth, courses, and client
- README.md updated with full usage examples
- SyntaxHighlighter utility component for code blocks

### Fixed

- Added proper error handling in client requests
- Improved SDK module structure and typings

## [1.0.4] - 2026-01-27

### Fixed

- Resolved `404 Course not found` error when fetching courses via the SDK by aligning SDK `getAll()` with the backend `/courses` route.
- Updated SDK `getAll()` to correctly wrap backend array response into `{ courses, total }` for consistent output.
- Ensured local backend `/api/courses` returns full course objects compatible with SDK expectations.
