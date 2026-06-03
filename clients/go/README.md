# CheFu Academy Go Client

Official Go module source for the CheFu Academy API.

## Usage

```go
client := chefuacademy.NewClient(chefuacademy.Config{
    APIKey: "chf_publicId_secret",
})
courses, err := client.ListCourses(context.Background(), chefuacademy.ListOptions{Limit: 5})
```

## Local Module

```bash
cd clients/go
go test ./...
```
