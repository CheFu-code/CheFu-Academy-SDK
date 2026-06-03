package com.chefu.academy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.StringJoiner;

public final class CheFuAcademyClient {
    public static final String DEFAULT_BASE_URL = "https://api.chefuinc.com/api";

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient;
    private final String baseUrl;
    private String apiKey;
    private String authToken;

    public CheFuAcademyClient(String apiKey, String authToken, String baseUrl) {
        this.apiKey = apiKey;
        this.authToken = authToken;
        this.baseUrl = trimTrailingSlash(baseUrl == null || baseUrl.isBlank() ? DEFAULT_BASE_URL : baseUrl);
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    public static CheFuAcademyClient withApiKey(String apiKey) {
        return new CheFuAcademyClient(apiKey, null, DEFAULT_BASE_URL);
    }

    public void setAuthToken(String token) {
        this.authToken = token;
    }

    public JsonNode login(String email, String password) {
        ObjectNode body = mapper.createObjectNode()
            .put("email", email)
            .put("password", password);
        JsonNode session = request("POST", "/auth/login", null, body, false, false);
        String token = text(session, "idToken");
        if (token == null || token.isBlank()) {
            token = text(session, "token");
        }
        if (token != null && !token.isBlank()) {
            setAuthToken(token);
        }
        return session;
    }

    public JsonNode register(String email, String password, String fullname) {
        ObjectNode body = mapper.createObjectNode()
            .put("email", email)
            .put("password", password)
            .put("fullname", fullname);
        return request("POST", "/auth/register", null, body, false, false);
    }

    public JsonNode refresh(String refreshToken) {
        ObjectNode body = mapper.createObjectNode().put("refreshToken", refreshToken);
        JsonNode session = request("POST", "/auth/refresh", null, body, false, false);
        String token = text(session, "idToken");
        if (token == null || token.isBlank()) {
            token = text(session, "token");
        }
        if (token != null && !token.isBlank()) {
            setAuthToken(token);
        }
        return session;
    }

    public JsonNode listCourses(Map<String, ?> query) {
        return request("GET", "/courses", query, null, false, true);
    }

    public JsonNode searchCourses(Map<String, ?> query) {
        return request("GET", "/courses/search", query, null, false, true);
    }

    public JsonNode featuredCourses(Map<String, ?> query) {
        return request("GET", "/courses/featured", query, null, false, true);
    }

    public JsonNode courseCategories() {
        return request("GET", "/courses/categories", null, null, false, true);
    }

    public JsonNode course(String courseId) {
        return request("GET", "/courses/" + encode(courseId), null, null, false, true);
    }

    public JsonNode courseChapters(String courseId) {
        return request("GET", "/courses/" + encode(courseId) + "/chapters", null, null, false, true);
    }

    public JsonNode courseChapter(String courseId, int chapterIndex) {
        return request("GET", "/courses/" + encode(courseId) + "/chapters/" + chapterIndex, null, null, false, true);
    }

    public JsonNode courseLessons(String courseId, int chapterIndex) {
        return request("GET", "/courses/" + encode(courseId) + "/chapters/" + chapterIndex + "/lessons", null, null, false, true);
    }

    public JsonNode courseQuiz(String courseId) {
        return request("GET", "/courses/" + encode(courseId) + "/quiz", null, null, false, true);
    }

    public JsonNode courseFlashcards(String courseId) {
        return request("GET", "/courses/" + encode(courseId) + "/flashcards", null, null, false, true);
    }

    public JsonNode courseQa(String courseId) {
        return request("GET", "/courses/" + encode(courseId) + "/qa", null, null, false, true);
    }

    public JsonNode listVideos(Map<String, ?> query) {
        return request("GET", "/videos", query, null, false, true);
    }

    public JsonNode searchVideos(Map<String, ?> query) {
        return request("GET", "/videos/search", query, null, false, true);
    }

    public JsonNode videosByCategory(String category) {
        return request("GET", "/videos/category/" + encode(category), null, null, false, true);
    }

    public JsonNode video(String videoId) {
        return request("GET", "/videos/" + encode(videoId), null, null, false, true);
    }

    public JsonNode createKey(String name) {
        ObjectNode body = mapper.createObjectNode().put("name", name);
        return request("POST", "/keys/create", null, body, true, false);
    }

    public JsonNode listKeys() {
        return request("GET", "/keys/list", null, null, true, false);
    }

    public JsonNode revokeKey(String keyId) {
        ObjectNode body = mapper.createObjectNode().put("keyId", keyId);
        return request("POST", "/keys/revoke", null, body, true, false);
    }

    private JsonNode request(
        String method,
        String path,
        Map<String, ?> query,
        JsonNode body,
        boolean userAuth,
        boolean apiKeyAuth
    ) {
        String token = userAuth ? authToken : apiKey;
        if (userAuth && (token == null || token.isBlank())) {
            throw new CheFuAcademyException("User authentication is required.", 401);
        }
        if (apiKeyAuth && !userAuth && (token == null || token.isBlank())) {
            throw new CheFuAcademyException("API key is required.", 401);
        }

        String requestUrl = baseUrl + path + queryString(query);
        HttpRequest.Builder builder = HttpRequest.newBuilder()
            .uri(URI.create(requestUrl))
            .timeout(Duration.ofSeconds(10))
            .header("Accept", "application/json");
        if (token != null && !token.isBlank()) {
            builder.header("Authorization", "Bearer " + token);
        }
        if (body != null) {
            builder.header("Content-Type", "application/json");
            builder.method(method, HttpRequest.BodyPublishers.ofString(body.toString()));
        } else {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        }

        try {
            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new CheFuAcademyException(errorMessage(response.body()), response.statusCode());
            }
            return response.body().isBlank() ? mapper.createObjectNode() : mapper.readTree(response.body());
        } catch (IOException exception) {
            throw new CheFuAcademyException("Network or JSON error: " + exception.getMessage());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new CheFuAcademyException("Request interrupted.");
        }
    }

    private String errorMessage(String body) {
        try {
            JsonNode node = mapper.readTree(body);
            JsonNode message = node.get("message");
            if (message != null) {
                if (message.isArray()) {
                    StringJoiner joiner = new StringJoiner(" ");
                    message.forEach(item -> joiner.add(item.asText()));
                    return joiner.toString();
                }
                return message.asText();
            }
            JsonNode error = node.get("error");
            if (error != null) {
                return error.asText();
            }
        } catch (IOException ignored) {
            return body;
        }
        return body == null || body.isBlank() ? "CheFu Academy request failed." : body;
    }

    private String queryString(Map<String, ?> query) {
        if (query == null || query.isEmpty()) {
            return "";
        }
        StringJoiner joiner = new StringJoiner("&", "?", "");
        query.forEach((key, value) -> {
            if (value != null && !value.toString().isBlank()) {
                joiner.add(encode(key) + "=" + encode(value.toString()));
            }
        });
        return joiner.length() <= 1 ? "" : joiner.toString();
    }

    private static String trimTrailingSlash(String value) {
        return value.replaceAll("/+$", "");
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }
}
