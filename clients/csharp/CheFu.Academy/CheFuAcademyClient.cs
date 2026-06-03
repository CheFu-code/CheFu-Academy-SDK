using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace CheFu.Academy;

public sealed class CheFuAcademyClient : IDisposable
{
    public const string DefaultBaseUrl = "https://api.chefuinc.com/api";

    private readonly HttpClient _httpClient;
    private readonly bool _ownsHttpClient;
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web);
    private string? _apiKey;
    private string? _authToken;

    public CheFuAcademyClient(
        string? apiKey = null,
        string? authToken = null,
        string baseUrl = DefaultBaseUrl,
        HttpClient? httpClient = null)
    {
        _apiKey = apiKey;
        _authToken = authToken;
        _httpClient = httpClient ?? new HttpClient();
        _ownsHttpClient = httpClient is null;
        _httpClient.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
        _httpClient.Timeout = TimeSpan.FromSeconds(10);
    }

    public void SetAuthToken(string token)
    {
        _authToken = token;
    }

    public async Task<JsonNode?> LoginAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        var session = await RequestAsync(
            HttpMethod.Post,
            "auth/login",
            body: new Dictionary<string, object?>
            {
                ["email"] = email,
                ["password"] = password,
            },
            apiKeyAuth: false,
            cancellationToken: cancellationToken);
        var token = session?["idToken"]?.GetValue<string>() ?? session?["token"]?.GetValue<string>();
        if (!string.IsNullOrWhiteSpace(token))
        {
            SetAuthToken(token);
        }
        return session;
    }

    public Task<JsonNode?> RegisterAsync(string email, string password, string fullname, CancellationToken cancellationToken = default)
    {
        return RequestAsync(
            HttpMethod.Post,
            "auth/register",
            body: new Dictionary<string, object?>
            {
                ["email"] = email,
                ["password"] = password,
                ["fullname"] = fullname,
            },
            apiKeyAuth: false,
            cancellationToken: cancellationToken);
    }

    public async Task<JsonNode?> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var session = await RequestAsync(
            HttpMethod.Post,
            "auth/refresh",
            body: new Dictionary<string, object?> { ["refreshToken"] = refreshToken },
            apiKeyAuth: false,
            cancellationToken: cancellationToken);
        var token = session?["idToken"]?.GetValue<string>() ?? session?["token"]?.GetValue<string>();
        if (!string.IsNullOrWhiteSpace(token))
        {
            SetAuthToken(token);
        }
        return session;
    }

    public Task<JsonNode?> ListCoursesAsync(IDictionary<string, object?>? query = null, CancellationToken cancellationToken = default)
    {
        return RequestAsync(HttpMethod.Get, "courses", query: query, cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> SearchCoursesAsync(IDictionary<string, object?>? query = null, CancellationToken cancellationToken = default)
    {
        return RequestAsync(HttpMethod.Get, "courses/search", query: query, cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> FeaturedCoursesAsync(IDictionary<string, object?>? query = null, CancellationToken cancellationToken = default)
    {
        return RequestAsync(HttpMethod.Get, "courses/featured", query: query, cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> CourseCategoriesAsync(CancellationToken cancellationToken = default)
    {
        return RequestAsync(HttpMethod.Get, "courses/categories", cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> CourseAsync(string courseId, CancellationToken cancellationToken = default)
    {
        return RequestAsync(HttpMethod.Get, $"courses/{Uri.EscapeDataString(courseId)}", cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> CourseChaptersAsync(string courseId, CancellationToken cancellationToken = default)
    {
        return RequestAsync(HttpMethod.Get, $"courses/{Uri.EscapeDataString(courseId)}/chapters", cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> CourseChapterAsync(string courseId, int chapterIndex, CancellationToken cancellationToken = default)
    {
        return RequestAsync(HttpMethod.Get, $"courses/{Uri.EscapeDataString(courseId)}/chapters/{chapterIndex}", cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> CourseLessonsAsync(string courseId, int chapterIndex, CancellationToken cancellationToken = default)
    {
        return RequestAsync(HttpMethod.Get, $"courses/{Uri.EscapeDataString(courseId)}/chapters/{chapterIndex}/lessons", cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> CourseQuizAsync(string courseId, CancellationToken cancellationToken = default)
    {
        return RequestAsync(HttpMethod.Get, $"courses/{Uri.EscapeDataString(courseId)}/quiz", cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> CourseFlashcardsAsync(string courseId, CancellationToken cancellationToken = default)
    {
        return RequestAsync(HttpMethod.Get, $"courses/{Uri.EscapeDataString(courseId)}/flashcards", cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> CourseQaAsync(string courseId, CancellationToken cancellationToken = default)
    {
        return RequestAsync(HttpMethod.Get, $"courses/{Uri.EscapeDataString(courseId)}/qa", cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> ListVideosAsync(IDictionary<string, object?>? query = null, CancellationToken cancellationToken = default)
    {
        return RequestAsync(HttpMethod.Get, "videos", query: query, cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> SearchVideosAsync(IDictionary<string, object?>? query = null, CancellationToken cancellationToken = default)
    {
        return RequestAsync(HttpMethod.Get, "videos/search", query: query, cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> VideosByCategoryAsync(string category, CancellationToken cancellationToken = default)
    {
        return RequestAsync(HttpMethod.Get, $"videos/category/{Uri.EscapeDataString(category)}", cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> VideoAsync(string videoId, CancellationToken cancellationToken = default)
    {
        return RequestAsync(HttpMethod.Get, $"videos/{Uri.EscapeDataString(videoId)}", cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> CreateKeyAsync(string? name = null, CancellationToken cancellationToken = default)
    {
        return RequestAsync(
            HttpMethod.Post,
            "keys/create",
            body: new Dictionary<string, object?> { ["name"] = name },
            userAuth: true,
            apiKeyAuth: false,
            cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> ListKeysAsync(CancellationToken cancellationToken = default)
    {
        return RequestAsync(HttpMethod.Get, "keys/list", userAuth: true, apiKeyAuth: false, cancellationToken: cancellationToken);
    }

    public Task<JsonNode?> RevokeKeyAsync(string keyId, CancellationToken cancellationToken = default)
    {
        return RequestAsync(
            HttpMethod.Post,
            "keys/revoke",
            body: new Dictionary<string, object?> { ["keyId"] = keyId },
            userAuth: true,
            apiKeyAuth: false,
            cancellationToken: cancellationToken);
    }

    private async Task<JsonNode?> RequestAsync(
        HttpMethod method,
        string path,
        IDictionary<string, object?>? query = null,
        object? body = null,
        bool userAuth = false,
        bool apiKeyAuth = true,
        CancellationToken cancellationToken = default)
    {
        var token = userAuth ? _authToken : _apiKey;
        if (userAuth && string.IsNullOrWhiteSpace(token))
        {
            throw new CheFuAcademyException("User authentication is required.", 401);
        }
        if (apiKeyAuth && !userAuth && string.IsNullOrWhiteSpace(token))
        {
            throw new CheFuAcademyException("API key is required.", 401);
        }

        using var request = new HttpRequestMessage(method, path + QueryString(query));
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        if (!string.IsNullOrWhiteSpace(token))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }
        if (body is not null)
        {
            request.Content = new StringContent(JsonSerializer.Serialize(body, _jsonOptions), Encoding.UTF8, "application/json");
        }

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new CheFuAcademyException(ErrorMessage(responseBody), (int)response.StatusCode);
        }

        return string.IsNullOrWhiteSpace(responseBody) ? null : JsonNode.Parse(responseBody);
    }

    private static string QueryString(IDictionary<string, object?>? query)
    {
        if (query is null || query.Count == 0)
        {
            return string.Empty;
        }

        var pairs = query
            .Where(pair => pair.Value is not null && !string.IsNullOrWhiteSpace(pair.Value.ToString()))
            .Select(pair => $"{Uri.EscapeDataString(pair.Key)}={Uri.EscapeDataString(pair.Value!.ToString()!)}");
        var joined = string.Join("&", pairs);
        return joined.Length == 0 ? string.Empty : "?" + joined;
    }

    private static string ErrorMessage(string body)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return "CheFu Academy request failed.";
        }

        try
        {
            var node = JsonNode.Parse(body);
            var message = node?["message"];
            if (message is JsonArray array)
            {
                return string.Join(" ", array.Select(item => item?.ToString()).Where(item => !string.IsNullOrWhiteSpace(item)));
            }
            if (message is not null)
            {
                return message.ToString();
            }
            var error = node?["error"];
            if (error is not null)
            {
                return error.ToString();
            }
        }
        catch (JsonException)
        {
            return body;
        }

        return body;
    }

    public void Dispose()
    {
        if (_ownsHttpClient)
        {
            _httpClient.Dispose();
        }
    }
}
