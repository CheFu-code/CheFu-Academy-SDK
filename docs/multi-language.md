# CheFu Academy API in Other Languages

The npm package is still the first-class JavaScript and TypeScript SDK, but the
CheFu Academy API is language-neutral. Every SDK method maps to a REST endpoint
under:

```text
https://api.chefuinc.com/api
```

Use the OpenAPI contract at:

```text
openapi/chefu-academy-api.openapi.yaml
```

## Authentication

Catalog endpoints use a CheFu Academy developer API key:

```http
Authorization: Bearer chf_publicId_secret
```

User/developer account endpoints use the Firebase ID token returned by
`POST /auth/login`:

```http
Authorization: Bearer <idToken>
```

Use API keys for:

- `GET /courses`
- `GET /courses/search`
- `GET /courses/featured`
- `GET /videos`
- `GET /videos/search`

Use user auth tokens for:

- `POST /keys/create`
- `GET /keys/list`
- `POST /keys/revoke`

## Pagination

List endpoints accept:

- `limit`: maximum items to return
- `cursor`: the `nextCursor` value from the previous response

Example:

```http
GET /courses?limit=20&cursor=20
```

## Generate Native Clients

You can generate clients from the OpenAPI file with OpenAPI Generator:

```bash
npx @openapitools/openapi-generator-cli generate \
  -i openapi/chefu-academy-api.openapi.yaml \
  -g python \
  -o generated/python
```

Common generator names:

```text
python
go
java
csharp
php
ruby
kotlin
swift5
rust
dart
```

Generated clients are a good start, but keep the OpenAPI contract as the source
of truth and review generated code before publishing a production package.

## Manual HTTP Quick Starts

Each example reads `CHEFU_API_KEY` from the environment.

```bash
export CHEFU_API_KEY="chf_publicId_secret"
```

Examples included in this repository:

- `examples/curl/quickstart.sh`
- `examples/python/chefu_academy_quickstart.py`
- `examples/go/quickstart.go`
- `examples/java/CheFuAcademyQuickstart.java`
- `examples/csharp/Program.cs`
- `examples/php/quickstart.php`
- `examples/ruby/quickstart.rb`

All examples call `GET /courses?limit=5` and print course titles.

## Minimal Request Shape

Any language can call the API with these pieces:

1. Base URL: `https://api.chefuinc.com/api`
2. Header: `Authorization: Bearer <api key>`
3. JSON parsing
4. Non-2xx error handling

Example response shape:

```json
{
  "courses": [
    {
      "id": "course-id",
      "courseTitle": "Intro to JavaScript"
    }
  ],
  "nextCursor": null,
  "total": 1
}
```

## Recommended Native SDK Roadmap

When we are ready to publish official packages beyond npm, use this order:

1. Python: highest demand for education/data workflows.
2. Go: backend services and CLI tools.
3. C#: .NET enterprise and game tooling.
4. Java/Kotlin: Android and JVM backends.
5. PHP/Ruby: web integrations.
6. Swift/Dart: mobile clients.

Each native SDK should keep the same concepts as the TypeScript SDK:

- `client.courses.list()`
- `client.courses.search()`
- `client.videos.list()`
- `client.auth.login()`
- `client.keys.create()`
