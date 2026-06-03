from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


DEFAULT_BASE_URL = "https://api.chefuinc.com/api"


class CheFuAcademyError(Exception):
    def __init__(self, message: str, status_code: int | None = None, details: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.details = details


class CheFuAcademy:
    def __init__(
        self,
        api_key: str | None = None,
        auth_token: str | None = None,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = 10,
    ):
        self.api_key = api_key
        self.auth_token = auth_token
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.auth = AuthClient(self)
        self.courses = CoursesClient(self)
        self.videos = VideosClient(self)
        self.keys = KeysClient(self)

    def set_auth_token(self, token: str) -> None:
        self.auth_token = token

    def request(
        self,
        method: str,
        path: str,
        *,
        query: dict[str, Any] | None = None,
        body: dict[str, Any] | None = None,
        user_auth: bool = False,
        api_key_auth: bool = True,
    ) -> Any:
        url = f"{self.base_url}{path}"
        clean_query = {
            key: str(value)
            for key, value in (query or {}).items()
            if value is not None and value != ""
        }
        if clean_query:
            url = f"{url}?{urllib.parse.urlencode(clean_query)}"

        headers = {"Accept": "application/json"}
        if body is not None:
            headers["Content-Type"] = "application/json"

        token = self.auth_token if user_auth else self.api_key
        if user_auth and not token:
            raise CheFuAcademyError("User authentication is required.", 401)
        if api_key_auth and not user_auth and not token:
            raise CheFuAcademyError("API key is required.", 401)
        if token:
            headers["Authorization"] = f"Bearer {token}"

        request = urllib.request.Request(
            url,
            method=method.upper(),
            headers=headers,
            data=json.dumps(body).encode("utf-8") if body is not None else None,
        )

        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                data = response.read().decode("utf-8")
                return json.loads(data) if data else None
        except urllib.error.HTTPError as error:
            raw = error.read().decode("utf-8")
            details = _parse_json(raw)
            message = _error_message(details) or raw or "CheFu Academy request failed."
            raise CheFuAcademyError(message, error.code, details) from error
        except urllib.error.URLError as error:
            raise CheFuAcademyError("Network error. Please check your connection.") from error


class AuthClient:
    def __init__(self, client: CheFuAcademy):
        self._client = client

    def login(self, email: str, password: str) -> dict[str, Any]:
        session = self._client.request(
            "POST",
            "/auth/login",
            body={"email": email, "password": password},
            api_key_auth=False,
        )
        token = session.get("idToken") or session.get("token")
        if token:
            self._client.set_auth_token(token)
        return session

    def register(self, email: str, password: str, fullname: str) -> dict[str, Any]:
        return self._client.request(
            "POST",
            "/auth/register",
            body={"email": email, "password": password, "fullname": fullname},
            api_key_auth=False,
        )

    def refresh(self, refresh_token: str) -> dict[str, Any]:
        session = self._client.request(
            "POST",
            "/auth/refresh",
            body={"refreshToken": refresh_token},
            api_key_auth=False,
        )
        token = session.get("idToken") or session.get("token")
        if token:
            self._client.set_auth_token(token)
        return session


class CoursesClient:
    def __init__(self, client: CheFuAcademy):
        self._client = client

    def list(self, **query: Any) -> dict[str, Any]:
        return self._client.request("GET", "/courses", query=query)

    def search(self, **query: Any) -> dict[str, Any]:
        return self._client.request("GET", "/courses/search", query=query)

    def featured(self, **query: Any) -> dict[str, Any]:
        return self._client.request("GET", "/courses/featured", query=query)

    def categories(self) -> dict[str, Any]:
        return self._client.request("GET", "/courses/categories")

    def get(self, course_id: str) -> dict[str, Any]:
        return self._client.request("GET", f"/courses/{_quote(course_id)}")

    def chapters(self, course_id: str) -> dict[str, Any]:
        return self._client.request("GET", f"/courses/{_quote(course_id)}/chapters")

    def chapter(self, course_id: str, chapter_index: int) -> dict[str, Any]:
        return self._client.request(
            "GET",
            f"/courses/{_quote(course_id)}/chapters/{chapter_index}",
        )

    def lessons(self, course_id: str, chapter_index: int) -> dict[str, Any]:
        return self._client.request(
            "GET",
            f"/courses/{_quote(course_id)}/chapters/{chapter_index}/lessons",
        )

    def quiz(self, course_id: str) -> dict[str, Any]:
        return self._client.request("GET", f"/courses/{_quote(course_id)}/quiz")

    def flashcards(self, course_id: str) -> dict[str, Any]:
        return self._client.request("GET", f"/courses/{_quote(course_id)}/flashcards")

    def qa(self, course_id: str) -> dict[str, Any]:
        return self._client.request("GET", f"/courses/{_quote(course_id)}/qa")


class VideosClient:
    def __init__(self, client: CheFuAcademy):
        self._client = client

    def list(self, **query: Any) -> dict[str, Any]:
        return self._client.request("GET", "/videos", query=query)

    def search(self, **query: Any) -> dict[str, Any]:
        return self._client.request("GET", "/videos/search", query=query)

    def category(self, category: str) -> dict[str, Any]:
        return self._client.request("GET", f"/videos/category/{_quote(category)}")

    def get(self, video_id: str) -> dict[str, Any]:
        return self._client.request("GET", f"/videos/{_quote(video_id)}")


class KeysClient:
    def __init__(self, client: CheFuAcademy):
        self._client = client

    def create(self, name: str | None = None) -> dict[str, Any]:
        return self._client.request(
            "POST",
            "/keys/create",
            body={"name": name},
            user_auth=True,
        )

    def list(self) -> list[dict[str, Any]]:
        return self._client.request("GET", "/keys/list", user_auth=True)

    def revoke(self, key_id: str) -> dict[str, Any]:
        return self._client.request(
            "POST",
            "/keys/revoke",
            body={"keyId": key_id},
            user_auth=True,
        )


def _quote(value: str) -> str:
    return urllib.parse.quote(value, safe="")


def _parse_json(value: str) -> Any:
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return None


def _error_message(details: Any) -> str | None:
    if not isinstance(details, dict):
        return None
    message = details.get("message")
    if isinstance(message, list):
        return " ".join(str(item) for item in message)
    if isinstance(message, str):
        return message
    error = details.get("error")
    return error if isinstance(error, str) else None
