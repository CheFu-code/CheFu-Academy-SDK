# CheFu Academy Java Client

Official Java/Maven source client for the CheFu Academy API.

## Usage

```java
CheFuAcademyClient client = CheFuAcademyClient.withApiKey("chf_publicId_secret");
JsonNode courses = client.listCourses(Map.of("limit", 5));
```

## Local Build

```bash
cd clients/java
mvn test
```
