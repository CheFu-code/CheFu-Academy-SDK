# CheFu Academy SDK

A fully typed **TypeScript SDK** for interacting with the **CheFu Academy** platform.  
This SDK simplifies authentication, API requests, and access to CheFu Academy resources such as courses.

Designed for **Node.js** and modern JavaScript/TypeScript projects.

---


## Features

- API key–based authentication
- Centralized API client
- Course listing & retrieval
- Clean, minimal SDK design
- Full TypeScript typings
- Ready for production & npm

---


## Installation

```bash
npm install chefu-academy-sdk
```

or using yarn:

```bash
yarn add chefu-academy-sdk
```

When installed in an interactive terminal, the package immediately opens a
small setup prompt so users can log in or register a new CheFu Academy account.
CI and non-interactive installs skip the prompt automatically.

To skip account setup manually:

```bash
CHEFU_SDK_SKIP_AUTH=1 npm install chefu-academy-sdk
```

To run setup later:

```bash
npx chefu-academy login
npx chefu-academy register
```

---


## Quick Start

### Import the SDK

```ts
import { CheFuAcademy } from "chefu-academy-sdk";
```

### Initialize the client

```ts
const sdk = new CheFuAcademy({
  apiKey: "YOUR_API_KEY",
});
```

By default, the SDK talks to the unified CheFu Inc API at
`https://api.chefuinc.com/api`. For local development or private deployments,
pass `baseURL` when creating the client.

### Fetch courses

```ts
async function main() {
  const courses = await sdk.courses.getAll();
  console.log(courses);
}

main();
```

---


## Available APIs

### Courses

```ts
sdk.courses.getAll();        // List all courses
sdk.courses.getById(courseId); // Get a single course
```

### Authentication

Authentication is handled automatically using your API key.

```ts
new CheFuAcademy({
  apiKey: process.env.CHEFU_API_KEY,
});
```

For Node.js terminal apps, you can prompt the user for their CheFu Academy
email and password:

```ts
import CheFuAcademy from "chefu-academy-sdk";

const sdk = new CheFuAcademy({
  apiKey: process.env.CHEFU_API_KEY!,
});

const session = await sdk.auth.loginWithTerminal();
console.log(`Logged in as ${session.user.email}`);
```

`loginWithTerminal()` masks password input when running in an interactive TTY.

The installed CLI uses the same auth endpoints:

```bash
chefu-academy login
chefu-academy register
chefu-academy whoami
chefu-academy logout
```

---


## Development

### Scripts

```bash
npm run build   # Build SDK
npm run lint    # Lint code
npm test        # Run tests
```

### Project Structure

```
src/
 ├─ auth.ts        # Authentication logic
 ├─ client.ts      # HTTP client
 ├─ courses.ts     # Course endpoints
 ├─ index.ts       # Public SDK exports
```

---


## Example Project

```ts
import { CheFuAcademy } from "chefu-academy-sdk";

const sdk = new CheFuAcademy({ apiKey: "sk_live_xxx" });

const courses = await sdk.courses.getAll();
console.log(courses);
```

---


## Requirements

- Node.js 18+
- TypeScript 5+ (optional but recommended)

---


## License

MIT License © CheFu Academy
