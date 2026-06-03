# CheFu Academy .NET Client

Official .NET source client for the CheFu Academy API.

## Usage

```csharp
var client = new CheFuAcademyClient(apiKey: "chf_publicId_secret");
var courses = await client.ListCoursesAsync(new Dictionary<string, object?>
{
    ["limit"] = 5,
});
```

## Local Build

```bash
dotnet build clients/csharp/CheFu.Academy
```
