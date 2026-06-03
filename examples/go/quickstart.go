package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"
)

type Course struct {
	ID          string `json:"id"`
	CourseTitle string `json:"courseTitle"`
	Title       string `json:"title"`
}

type CourseListResponse struct {
	Courses []Course `json:"courses"`
	Total   int      `json:"total"`
}

func main() {
	apiKey := os.Getenv("CHEFU_API_KEY")
	if apiKey == "" {
		fatal("Set CHEFU_API_KEY before running this example.")
	}

	baseURL := os.Getenv("CHEFU_API_BASE_URL")
	if baseURL == "" {
		baseURL = "https://api.chefuinc.com/api"
	}

	endpoint, err := url.Parse(baseURL + "/courses")
	if err != nil {
		fatal(err.Error())
	}
	query := endpoint.Query()
	query.Set("limit", "5")
	endpoint.RawQuery = query.Encode()

	request, err := http.NewRequest(http.MethodGet, endpoint.String(), nil)
	if err != nil {
		fatal(err.Error())
	}
	request.Header.Set("Authorization", "Bearer "+apiKey)
	request.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	response, err := client.Do(request)
	if err != nil {
		fatal(err.Error())
	}
	defer response.Body.Close()

	body, err := io.ReadAll(response.Body)
	if err != nil {
		fatal(err.Error())
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		fatal(fmt.Sprintf("CheFu API error %d: %s", response.StatusCode, body))
	}

	var courses CourseListResponse
	if err := json.Unmarshal(body, &courses); err != nil {
		fatal(err.Error())
	}

	for _, course := range courses.Courses {
		title := course.CourseTitle
		if title == "" {
			title = course.Title
		}
		if title == "" {
			title = course.ID
		}
		fmt.Println("- " + title)
	}
}

func fatal(message string) {
	fmt.Fprintln(os.Stderr, message)
	os.Exit(1)
}
