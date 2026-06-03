package chefuacademy

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const DefaultBaseURL = "https://api.chefuinc.com/api"

type Config struct {
	APIKey     string
	AuthToken  string
	BaseURL    string
	HTTPClient *http.Client
}

type Client struct {
	apiKey     string
	authToken  string
	baseURL    string
	httpClient *http.Client
}

type Error struct {
	StatusCode int
	Message    string
	Details    map[string]any
}

func (e *Error) Error() string {
	if e.StatusCode == 0 {
		return e.Message
	}
	return fmt.Sprintf("chefu academy: %s (%d)", e.Message, e.StatusCode)
}

type ListOptions struct {
	Query    string
	Category string
	Cursor   string
	Limit    int
}

type CourseListResponse struct {
	Courses    []map[string]any `json:"courses"`
	NextCursor *string          `json:"nextCursor"`
	Total      int              `json:"total"`
}

type VideoListResponse struct {
	Videos     []map[string]any `json:"videos"`
	NextCursor *string          `json:"nextCursor"`
	Total      int              `json:"total"`
}

type LoginResponse struct {
	Token        string         `json:"token"`
	IDToken      string         `json:"idToken"`
	RefreshToken string         `json:"refreshToken"`
	ExpiresIn    string         `json:"expiresIn"`
	CustomToken  string         `json:"customToken"`
	User         map[string]any `json:"user"`
}

func NewClient(config Config) *Client {
	baseURL := strings.TrimRight(config.BaseURL, "/")
	if baseURL == "" {
		baseURL = DefaultBaseURL
	}

	httpClient := config.HTTPClient
	if httpClient == nil {
		httpClient = &http.Client{Timeout: 10 * time.Second}
	}

	return &Client{
		apiKey:     config.APIKey,
		authToken:  config.AuthToken,
		baseURL:    baseURL,
		httpClient: httpClient,
	}
}

func (c *Client) SetAuthToken(token string) {
	c.authToken = token
}

func (c *Client) Login(ctx context.Context, email, password string) (*LoginResponse, error) {
	var out LoginResponse
	if err := c.request(ctx, http.MethodPost, "/auth/login", nil, map[string]any{
		"email":    email,
		"password": password,
	}, false, false, &out); err != nil {
		return nil, err
	}
	if out.IDToken != "" {
		c.SetAuthToken(out.IDToken)
	} else if out.Token != "" {
		c.SetAuthToken(out.Token)
	}
	return &out, nil
}

func (c *Client) Register(ctx context.Context, email, password, fullname string) (map[string]any, error) {
	var out map[string]any
	err := c.request(ctx, http.MethodPost, "/auth/register", nil, map[string]any{
		"email":    email,
		"password": password,
		"fullname": fullname,
	}, false, false, &out)
	return out, err
}

func (c *Client) Refresh(ctx context.Context, refreshToken string) (*LoginResponse, error) {
	var out LoginResponse
	if err := c.request(ctx, http.MethodPost, "/auth/refresh", nil, map[string]any{
		"refreshToken": refreshToken,
	}, false, false, &out); err != nil {
		return nil, err
	}
	if out.IDToken != "" {
		c.SetAuthToken(out.IDToken)
	} else if out.Token != "" {
		c.SetAuthToken(out.Token)
	}
	return &out, nil
}

func (c *Client) ListCourses(ctx context.Context, options ListOptions) (*CourseListResponse, error) {
	var out CourseListResponse
	err := c.request(ctx, http.MethodGet, "/courses", options.values(), nil, false, true, &out)
	return &out, err
}

func (c *Client) SearchCourses(ctx context.Context, options ListOptions) (*CourseListResponse, error) {
	var out CourseListResponse
	err := c.request(ctx, http.MethodGet, "/courses/search", options.values(), nil, false, true, &out)
	return &out, err
}

func (c *Client) FeaturedCourses(ctx context.Context, options ListOptions) (*CourseListResponse, error) {
	var out CourseListResponse
	err := c.request(ctx, http.MethodGet, "/courses/featured", options.values(), nil, false, true, &out)
	return &out, err
}

func (c *Client) CourseCategories(ctx context.Context) (map[string]any, error) {
	var out map[string]any
	err := c.request(ctx, http.MethodGet, "/courses/categories", nil, nil, false, true, &out)
	return out, err
}

func (c *Client) Course(ctx context.Context, courseID string) (map[string]any, error) {
	var out map[string]any
	err := c.request(ctx, http.MethodGet, "/courses/"+url.PathEscape(courseID), nil, nil, false, true, &out)
	return out, err
}

func (c *Client) CourseChapters(ctx context.Context, courseID string) (map[string]any, error) {
	return c.getMap(ctx, "/courses/"+url.PathEscape(courseID)+"/chapters")
}

func (c *Client) CourseChapter(ctx context.Context, courseID string, chapterIndex int) (map[string]any, error) {
	return c.getMap(ctx, fmt.Sprintf("/courses/%s/chapters/%d", url.PathEscape(courseID), chapterIndex))
}

func (c *Client) CourseLessons(ctx context.Context, courseID string, chapterIndex int) (map[string]any, error) {
	return c.getMap(ctx, fmt.Sprintf("/courses/%s/chapters/%d/lessons", url.PathEscape(courseID), chapterIndex))
}

func (c *Client) CourseQuiz(ctx context.Context, courseID string) (map[string]any, error) {
	return c.getMap(ctx, "/courses/"+url.PathEscape(courseID)+"/quiz")
}

func (c *Client) CourseFlashcards(ctx context.Context, courseID string) (map[string]any, error) {
	return c.getMap(ctx, "/courses/"+url.PathEscape(courseID)+"/flashcards")
}

func (c *Client) CourseQA(ctx context.Context, courseID string) (map[string]any, error) {
	return c.getMap(ctx, "/courses/"+url.PathEscape(courseID)+"/qa")
}

func (c *Client) ListVideos(ctx context.Context, options ListOptions) (*VideoListResponse, error) {
	var out VideoListResponse
	err := c.request(ctx, http.MethodGet, "/videos", options.values(), nil, false, true, &out)
	return &out, err
}

func (c *Client) SearchVideos(ctx context.Context, options ListOptions) (*VideoListResponse, error) {
	var out VideoListResponse
	err := c.request(ctx, http.MethodGet, "/videos/search", options.values(), nil, false, true, &out)
	return &out, err
}

func (c *Client) VideosByCategory(ctx context.Context, category string) (*VideoListResponse, error) {
	var out VideoListResponse
	err := c.request(ctx, http.MethodGet, "/videos/category/"+url.PathEscape(category), nil, nil, false, true, &out)
	return &out, err
}

func (c *Client) Video(ctx context.Context, videoID string) (map[string]any, error) {
	var out map[string]any
	err := c.request(ctx, http.MethodGet, "/videos/"+url.PathEscape(videoID), nil, nil, false, true, &out)
	return out, err
}

func (c *Client) CreateKey(ctx context.Context, name string) (map[string]any, error) {
	var out map[string]any
	err := c.request(ctx, http.MethodPost, "/keys/create", nil, map[string]any{"name": name}, true, false, &out)
	return out, err
}

func (c *Client) ListKeys(ctx context.Context) ([]map[string]any, error) {
	var out []map[string]any
	err := c.request(ctx, http.MethodGet, "/keys/list", nil, nil, true, false, &out)
	return out, err
}

func (c *Client) RevokeKey(ctx context.Context, keyID string) (map[string]any, error) {
	var out map[string]any
	err := c.request(ctx, http.MethodPost, "/keys/revoke", nil, map[string]any{"keyId": keyID}, true, false, &out)
	return out, err
}

func (c *Client) getMap(ctx context.Context, path string) (map[string]any, error) {
	var out map[string]any
	err := c.request(ctx, http.MethodGet, path, nil, nil, false, true, &out)
	return out, err
}

func (c *Client) request(ctx context.Context, method, path string, query url.Values, body any, userAuth bool, apiKeyAuth bool, out any) error {
	requestURL := c.baseURL + path
	if len(query) > 0 {
		requestURL += "?" + query.Encode()
	}

	var reader io.Reader
	if body != nil {
		payload, err := json.Marshal(body)
		if err != nil {
			return err
		}
		reader = bytes.NewReader(payload)
	}

	req, err := http.NewRequestWithContext(ctx, method, requestURL, reader)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	token := c.apiKey
	if userAuth {
		token = c.authToken
	}
	if userAuth && token == "" {
		return &Error{StatusCode: 401, Message: "user authentication is required"}
	}
	if apiKeyAuth && !userAuth && token == "" {
		return &Error{StatusCode: 401, Message: "api key is required"}
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	res, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	responseBody, err := io.ReadAll(res.Body)
	if err != nil {
		return err
	}
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return parseAPIError(res.StatusCode, responseBody)
	}
	if len(responseBody) == 0 || out == nil {
		return nil
	}
	return json.Unmarshal(responseBody, out)
}

func (o ListOptions) values() url.Values {
	values := url.Values{}
	if o.Query != "" {
		values.Set("query", o.Query)
	}
	if o.Category != "" {
		values.Set("category", o.Category)
	}
	if o.Cursor != "" {
		values.Set("cursor", o.Cursor)
	}
	if o.Limit > 0 {
		values.Set("limit", strconv.Itoa(o.Limit))
	}
	return values
}

func parseAPIError(statusCode int, responseBody []byte) error {
	var details map[string]any
	_ = json.Unmarshal(responseBody, &details)

	message := strings.TrimSpace(string(responseBody))
	if value, ok := details["message"]; ok {
		switch typed := value.(type) {
		case string:
			message = typed
		case []any:
			parts := make([]string, 0, len(typed))
			for _, item := range typed {
				parts = append(parts, fmt.Sprint(item))
			}
			message = strings.Join(parts, " ")
		}
	}
	if value, ok := details["error"].(string); message == "" && ok {
		message = value
	}
	if message == "" {
		message = "CheFu Academy request failed"
	}

	return &Error{StatusCode: statusCode, Message: message, Details: details}
}
