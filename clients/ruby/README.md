# CheFu Academy Ruby Client

Official Ruby gem source for the CheFu Academy API.

## Usage

```ruby
client = CheFuAcademy::Client.new(api_key: 'chf_publicId_secret')
courses = client.list_courses(limit: 5)
```

## Local Install

```bash
bundle install
```
