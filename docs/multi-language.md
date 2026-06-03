# CheFu Academy SDK in Other Languages

The npm package remains the first-class JavaScript and TypeScript SDK, and this
repository now also includes official first-party client sources for other
languages. Every client maps to the same REST API under:

```text
https://api.chefuinc.com/api
```

Official client sources:

```text
clients/python
clients/go
clients/java
clients/csharp
clients/php
clients/ruby
clients/curl
```

The OpenAPI contract remains the source of truth:

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

## Official Client Packages

These clients are source-ready in this repo. Publishing them to registries such
as PyPI, Maven Central, NuGet, Packagist, RubyGems, and the Go module proxy
requires release credentials and automation, but the maintained client source is
now first-party.

### Python

```bash
pip install -e clients/python
```

```python
from chefu_academy import CheFuAcademy

client = CheFuAcademy(api_key="chf_publicId_secret")
print(client.courses.list(limit=5))
```

### Go

```go
client := chefuacademy.NewClient(chefuacademy.Config{
    APIKey: "chf_publicId_secret",
})
courses, err := client.ListCourses(context.Background(), chefuacademy.ListOptions{Limit: 5})
```

### Java

```java
CheFuAcademyClient client = CheFuAcademyClient.withApiKey("chf_publicId_secret");
JsonNode courses = client.listCourses(Map.of("limit", 5));
```

### C#

```csharp
var client = new CheFuAcademyClient(apiKey: "chf_publicId_secret");
var courses = await client.ListCoursesAsync(new Dictionary<string, object?>
{
    ["limit"] = 5,
});
```

### PHP

```php
$client = new \CheFu\Academy\CheFuAcademyClient(apiKey: 'chf_publicId_secret');
$courses = $client->listCourses(['limit' => 5]);
```

### Ruby

```ruby
client = CheFuAcademy::Client.new(api_key: 'chf_publicId_secret')
courses = client.list_courses(limit: 5)
```

### cURL

```bash
export CHEFU_API_KEY="chf_publicId_secret"
clients/curl/chefu-academy.sh courses list 5
```

## Generate Additional Clients

You can generate more clients from the OpenAPI file with OpenAPI Generator:

```bash
npx @openapitools/openapi-generator-cli generate \
  -i openapi/chefu-academy-api.openapi.yaml \
  -g python \
  -o generated/python
```

Useful generator names for future SDKs:

```text
kotlin
swift5
rust
dart
```

Generated clients are a good start for additional ecosystems, but keep the
OpenAPI contract as the source of truth and review generated code before
publishing a production package.

## Manual HTTP Quick Starts

Each example reads `CHEFU_API_KEY` from the environment.

```bash
export CHEFU_API_KEY="chf_publicId_secret"
```

Simple HTTP examples are still included in this repository:

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

Each official SDK keeps the same concepts as the TypeScript SDK:

- `client.courses.list()`
- `client.courses.search()`
- `client.videos.list()`
- `client.auth.login()`
- `client.keys.create()`
