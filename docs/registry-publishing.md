# Registry Publishing

This is the release runbook for the official CheFu Academy SDK clients outside
the TypeScript package.

## Published

- npm: `chefu-academy-sdk@1.0.10`
- Go module: `github.com/CheFu-code/chefu-academy-sdk/clients/go@v0.1.0`
- NuGet: `CheFu.Academy@0.1.0`
- RubyGems: `chefu_academy@0.1.0`

The Go client is published by Git tag, not by uploading to a package registry.
For the module under `clients/go`, the tag format is:

```bash
git tag clients/go/v0.1.0
git push origin clients/go/v0.1.0
```

Verify the Go proxy:

```bash
curl https://proxy.golang.org/github.com/!che!fu-code/chefu-academy-sdk/clients/go/@v/v0.1.0.info
```

## Package Names

These names were checked as available before first release:

| Registry      | Package                   |
| ------------- | ------------------------- |
| PyPI          | `chefu-academy`           |
| Maven Central | `com.chefu:chefu-academy` |
| NuGet         | `CheFu.Academy`           |
| Packagist     | `chefu/academy`           |
| RubyGems      | `chefu_academy`           |

## Required Credentials

Set credentials as environment variables or CI secrets. Do not commit them.

| Registry      | Required secret                                                   |
| ------------- | ----------------------------------------------------------------- |
| npm           | `NPM_TOKEN`                                                       |
| PyPI          | `PYPI_API_TOKEN`                                                  |
| NuGet         | `NUGET_API_KEY`                                                   |
| RubyGems      | `RUBYGEMS_API_KEY`                                                |
| Maven Central | Central/Sonatype username, token, GPG private key, GPG passphrase |
| Packagist     | Packagist username/token and a package/repo connection            |

## PyPI

Requires Python, `build`, `twine`, and `PYPI_API_TOKEN`.

```bash
cd clients/python
python -m pip install --upgrade build twine
python -m build
python -m twine check dist/*
python -m twine upload dist/* -u __token__ -p "$PYPI_API_TOKEN"
```

Install after publish:

```bash
pip install chefu-academy
```

## NuGet

Requires the .NET SDK and `NUGET_API_KEY`. GitHub Actions publishes the package
when the `clients/csharp/v0.1.0` tag is pushed, or when the
`Publish Native Clients` workflow is run manually with NuGet enabled.

```bash
dotnet pack clients/csharp/CheFu.Academy/CheFu.Academy.csproj -c Release
dotnet nuget push "clients/csharp/CheFu.Academy/bin/Release/CheFu.Academy.0.1.0.nupkg" \
  --api-key "$NUGET_API_KEY" \
  --source https://api.nuget.org/v3/index.json
```

Install after publish:

```bash
dotnet add package CheFu.Academy
```

## RubyGems

Requires Ruby, RubyGems, and `RUBYGEMS_API_KEY`. GitHub Actions publishes the
gem when the `clients/ruby/v0.1.0` tag is pushed, or when the
`Publish Native Clients` workflow is run manually with RubyGems enabled.

```bash
cd clients/ruby
gem build chefu_academy.gemspec
GEM_HOST_API_KEY="$RUBYGEMS_API_KEY" gem push chefu_academy-0.1.0.gem
```

Install after publish:

```bash
gem install chefu_academy
```

## Maven Central

Requires Maven Central publishing credentials and GPG signing. The Java client
POM already defines package identity and metadata, but Maven Central release
still needs deployment/signing configuration for the official CheFu namespace.

Expected install coordinate after publish:

```xml
<dependency>
  <groupId>com.chefu</groupId>
  <artifactId>chefu-academy</artifactId>
  <version>0.1.0</version>
</dependency>
```

## Packagist

Packagist publishes from a connected VCS repository and expects
`composer.json` in the default branch root. The repository root now includes a
Composer manifest for `chefu/academy` that autoloads the PHP source from
`clients/php/src`.

Submit this repository URL to Packagist:

```text
https://github.com/CheFu-code/CheFu-Academy-SDK
```

The PHP package release tag is:

```bash
git tag v0.1.0
git push origin v0.1.0
```

If you use the Packagist API, package creation requires the main Packagist API
token:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PACKAGIST_USERNAME:$PACKAGIST_TOKEN" \
  https://packagist.org/api/create-package \
  -d '{"repository":"https://github.com/CheFu-code/CheFu-Academy-SDK"}'
```

Install after publish:

```bash
composer require chefu/academy
```
