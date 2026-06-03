using System.Net.Http.Headers;
using System.Text.Json;

var apiKey = Environment.GetEnvironmentVariable("CHEFU_API_KEY");
if (string.IsNullOrWhiteSpace(apiKey))
{
    throw new InvalidOperationException("Set CHEFU_API_KEY before running this example.");
}

var baseUrl = Environment.GetEnvironmentVariable("CHEFU_API_BASE_URL")
    ?? "https://api.chefuinc.com/api";

using var client = new HttpClient
{
    BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/"),
    Timeout = TimeSpan.FromSeconds(10),
};
client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

using var response = await client.GetAsync("courses?limit=5");
var body = await response.Content.ReadAsStringAsync();

if (!response.IsSuccessStatusCode)
{
    throw new InvalidOperationException($"CheFu API error {(int)response.StatusCode}: {body}");
}

using var json = JsonDocument.Parse(body);
foreach (var course in json.RootElement.GetProperty("courses").EnumerateArray())
{
    var title = ReadString(course, "courseTitle")
        ?? ReadString(course, "title")
        ?? ReadString(course, "id")
        ?? "Untitled course";
    Console.WriteLine($"- {title}");
}

static string? ReadString(JsonElement element, string propertyName)
{
    return element.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String
        ? value.GetString()
        : null;
}
