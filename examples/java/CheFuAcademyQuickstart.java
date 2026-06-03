import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

public final class CheFuAcademyQuickstart {
    public static void main(String[] args) throws Exception {
        String apiKey = System.getenv("CHEFU_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Set CHEFU_API_KEY before running this example.");
        }

        String baseUrl = System.getenv().getOrDefault(
            "CHEFU_API_BASE_URL",
            "https://api.chefuinc.com/api"
        );
        String url = baseUrl.replaceAll("/+$", "")
            + "/courses?limit="
            + URLEncoder.encode("5", StandardCharsets.UTF_8);

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Authorization", "Bearer " + apiKey)
            .header("Accept", "application/json")
            .GET()
            .build();

        HttpResponse<String> response = HttpClient.newHttpClient().send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(
                "CheFu API error " + response.statusCode() + ": " + response.body()
            );
        }

        System.out.println(response.body());
    }
}
