# CheFu Academy Java Client

Official Java/Maven source client for the CheFu Academy API.

## Install

After the Maven Central release is published:

```xml
<dependency>
  <groupId>com.chefuinc</groupId>
  <artifactId>chefu-academy</artifactId>
  <version>0.1.0</version>
</dependency>
```

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
