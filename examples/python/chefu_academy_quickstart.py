#!/usr/bin/env python3
import json
import os
import sys
import urllib.parse
import urllib.request


BASE_URL = os.getenv("CHEFU_API_BASE_URL", "https://api.chefuinc.com/api").rstrip("/")
API_KEY = os.getenv("CHEFU_API_KEY")


def request_json(path, query=None):
    if not API_KEY:
        raise RuntimeError("Set CHEFU_API_KEY before running this example.")

    url = f"{BASE_URL}{path}"
    if query:
        url = f"{url}?{urllib.parse.urlencode(query)}"

    request = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8")
        raise RuntimeError(f"CheFu API error {error.code}: {body}") from error


def main():
    data = request_json("/courses", {"limit": 5})
    for course in data.get("courses", []):
        title = course.get("courseTitle") or course.get("title") or course.get("id")
        print(f"- {title}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(error, file=sys.stderr)
        sys.exit(1)
