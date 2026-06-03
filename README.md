# CheFu Academy SDK

A fully typed **TypeScript SDK**, official multi-language client sources, and a
language-neutral REST contract for interacting with the **CheFu Academy**
platform. The npm package is designed for Node.js and modern
JavaScript/TypeScript projects, while the same repository now ships first-party
clients for Python, Go, Java, C#, PHP, Ruby, and cURL.

---

## Features

- API key–based authentication
- Centralized API client
- Course listing & retrieval
- Video listing & retrieval
- Developer API key management
- Clean, minimal SDK design
- Full TypeScript typings
- OpenAPI contract for non-JS clients
- Official Python, Go, Java, C#, PHP, Ruby, and cURL client sources
- Multi-language examples for direct REST calls
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

When installed in an interactive terminal, the package immediately opens an
arrow-key setup menu so users can log in or register a new CheFu Academy
account. CI and non-interactive installs skip the prompt automatically.

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
  apiKey: "chf_publicId_secret",
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

## Other Languages

CheFu Academy is not limited to JavaScript/TypeScript. The SDK repository now
includes official first-party clients, an OpenAPI contract, and simple HTTP
examples for common languages:

```text
clients/python
clients/go
clients/java
clients/csharp
clients/php
clients/ruby
clients/curl
openapi/chefu-academy-api.openapi.yaml
docs/multi-language.md
examples/python/chefu_academy_quickstart.py
examples/go/quickstart.go
examples/java/CheFuAcademyQuickstart.java
examples/csharp/Program.cs
examples/php/quickstart.php
examples/ruby/quickstart.rb
examples/curl/quickstart.sh
```

Every language uses the same REST base URL:

```text
https://api.chefuinc.com/api
```

And the same bearer API key header:

```http
Authorization: Bearer chf_publicId_secret
```

The non-JS client sources are maintained in this repo and shipped with the npm
package. Go, NuGet, Packagist, and RubyGems releases are available now;
dedicated PyPI and Maven Central releases still require their registry setup.

You can also generate additional clients from the OpenAPI contract:

```bash
npx @openapitools/openapi-generator-cli generate \
  -i openapi/chefu-academy-api.openapi.yaml \
  -g python \
  -o generated/python
```

See [docs/multi-language.md](docs/multi-language.md) for official client usage,
generator commands, auth rules, pagination, and example usage. See
[docs/registry-publishing.md](docs/registry-publishing.md) for the release
runbook.

---

## Available APIs

### Courses

```ts
sdk.courses.getAll({ limit: 20 });
sdk.courses.search({ query: "javascript", category: "Technology", limit: 10 });
sdk.courses.getFeatured({ limit: 8 });
sdk.courses.getCategories();
sdk.courses.getById(courseId);
sdk.courses.getChapters(courseId);
sdk.courses.getChapter(courseId, 0);
sdk.courses.getLessons(courseId, 0);
sdk.courses.getQuiz(courseId);
sdk.courses.getFlashcards(courseId);
sdk.courses.getQA(courseId);
```

### Videos

```ts
sdk.videos.getAll();
sdk.videos.getById(videoId);
sdk.videos.search({ query: "microchips", category: "Technology & Gadgets" });
sdk.videos.getByCategory("Technology & Gadgets");
```

### API Keys

API key management requires a logged-in developer user. You can pass a Firebase
ID token directly, or call `sdk.auth.login()` first and the SDK will attach the
returned token automatically.

```ts
const sdk = new CheFuAcademy({
  authToken: process.env.CHEFU_AUTH_TOKEN,
});

const created = await sdk.keys.create({ name: "Production" });
console.log(created.apiKey); // chf_publicId_secret

const keys = await sdk.keys.list();
await sdk.keys.revoke(keys[0].id);
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

Developer API keys can also be managed from the CLI after login:

```bash
chefu-academy keys create --name "Local development"
chefu-academy keys list
chefu-academy keys revoke <keyId>
```

The CLI stores your user login session locally and refreshes it when possible.
API key creation still requires an authenticated developer account; passwords
are prompted interactively and are never accepted as command-line flags.

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

const sdk = new CheFuAcademy({ apiKey: "chf_publicId_secret" });

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
