# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

## [1.0.10] - 2026-06-03

### Added

- Added an OpenAPI 3.1 contract for the CheFu Academy REST API.
- Added official first-party client sources for Python, Go, Java, C#, PHP, Ruby, and cURL.
- Added multi-language API guidance for official and generated native clients.
- Added quick-start examples for Python, Go, Java, C#, PHP, Ruby, and cURL.

## [1.0.9] - 2026-05-26

### Changed

- Replaced the numbered setup prompt with an arrow-key terminal menu.

## [1.0.8] - 2026-05-26

### Changed

- Improved CLI login and registration errors with user-friendly recovery steps.

## [1.0.7] - 2026-05-26

### Added

- Added an install-time terminal account setup prompt for login or registration.
- Added the `chefu-academy` CLI with `login`, `register`, `whoami`, and `logout` commands.

## [1.0.6] - 2026-05-26

### Added

- Added `sdk.auth.loginWithTerminal()` and `sdk.auth.loginFromTerminal()` for Node.js terminal login prompts.
- Exported auth, course, and client response/config types from the SDK entry point.

## [1.0.5] - 2026-05-26

### Changed

- Pointed the SDK default API base URL at the unified CheFu Inc backend.
- Improved error parsing for NestJS API responses.

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
