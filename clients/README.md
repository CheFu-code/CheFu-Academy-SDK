# Official CheFu Academy Clients

This directory contains first-party client sources for languages beyond the
JavaScript/TypeScript npm package.

Official clients included here:

- `python`: Python package source
- `go`: Go module source
- `java`: Maven package source
- `csharp`: .NET class library source
- `php`: Composer package source
- `ruby`: Ruby gem source
- `curl`: POSIX shell/cURL helper

All clients use the same API contract:

```text
../openapi/chefu-academy-api.openapi.yaml
```

The clients are source-ready in this monorepo. Publishing to language registries
such as PyPI, NuGet, Packagist, Maven Central, RubyGems, and the Go module proxy
requires registry credentials and release automation.

## Shared Environment

```bash
export CHEFU_API_KEY="chf_publicId_secret"
export CHEFU_API_BASE_URL="https://api.chefuinc.com/api"
```

`CHEFU_API_BASE_URL` is optional. Production is used by default.
