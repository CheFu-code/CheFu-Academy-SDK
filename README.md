# CheFu Academy SDK

A TypeScript SDK for interacting with the CheFu Academy platform. This SDK provides authentication, client management, and course-related functionalities for developers integrating with CheFu Academy services.

## Features
- Authentication utilities
- Client management
- Course management
- TypeScript support

## Installation

```
npm install chefu-academy-sdk
```

## Usage

Import the SDK modules as needed:

```typescript
import { authenticate } from './src/auth';
import { Client } from './src/client';
import { getCourses } from './src/courses';
```

### Example

```typescript
import { authenticate } from './src/auth';
import { Client } from './src/client';
import { getCourses } from './src/courses';

const client = new Client({ apiKey: 'YOUR_API_KEY' });
authenticate(client)
  .then(() => getCourses(client))
  .then(courses => console.log(courses));
```

## Development

- Build: `npm run build`
- Lint: `npm run lint`
- Test: `npm test`

## Project Structure

- `src/auth.ts` - Authentication logic
- `src/client.ts` - API client
- `src/courses.ts` - Course management
- `src/index.ts` - SDK entry point

## License

MIT
