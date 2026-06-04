from __future__ import annotations

import base64
import datetime as dt
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


DEFAULT_BASE_URL = "https://api.chefuinc.com/api"
CONFIG_DIR = Path.home() / ".chefu-academy"
CONFIG_FILE = CONFIG_DIR / "config.json"
TOKEN_REFRESH_BUFFER_SECONDS = 5 * 60
COLOR_ENABLED = (
    sys.stdout.isatty()
    and not os.environ.get("NO_COLOR")
    and os.environ.get("CHEFU_CLI_COLOR") != "0"
)

STYLES = {
    "reset": "\033[0m",
    "bold": "\033[1m",
    "dim": "\033[2m",
    "red": "\033[31m",
    "green": "\033[32m",
    "yellow": "\033[33m",
    "blue": "\033[34m",
    "magenta": "\033[35m",
    "cyan": "\033[36m",
    "gray": "\033[90m",
}


class CheFuCliError(Exception):
    def __init__(
        self,
        message: str,
        next_steps: list[str] | None = None,
        status_code: int | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.next_steps = next_steps or []
        self.status_code = status_code

    def format(self) -> str:
        if not self.next_steps:
            return color(self.message, "red", "bold")

        return "\n".join(
            [
                color(self.message, "red", "bold"),
                "",
                color("What you can do:", "cyan", "bold"),
                *[f"{color('-', 'cyan')} {step}" for step in self.next_steps],
            ]
        )


class Spinner:
    def __init__(self, message: str):
        self.message = message
        self._enabled = sys.stderr.isatty()
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

        if self._enabled:
            self._thread = threading.Thread(target=self._render, daemon=True)
            self._thread.start()

    def _render(self) -> None:
        frames = ["-", "\\", "|", "/"]
        index = 0
        while not self._stop.is_set():
            sys.stderr.write(f"\r{color(frames[index], 'cyan')} {self.message}")
            sys.stderr.flush()
            index = (index + 1) % len(frames)
            time.sleep(0.08)

    def succeed(self) -> None:
        self._done("OK", "green")

    def fail(self) -> None:
        self._done("FAIL", "red")

    def stop(self) -> None:
        if not self._enabled:
            return
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=0.25)
        sys.stderr.write("\r\033[K")
        sys.stderr.flush()

    def _done(self, label: str, status_color: str) -> None:
        if not self._enabled:
            return
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=0.25)
        sys.stderr.write(f"\r\033[K{color(label, status_color)} {self.message}\n")
        sys.stderr.flush()


def get_base_url() -> str:
    return (
        os.environ.get("CHEFU_API_BASE_URL")
        or os.environ.get("CHEFU_ACADEMY_API_URL")
        or DEFAULT_BASE_URL
    ).rstrip("/")


def is_local_api_url() -> bool:
    try:
        from urllib.parse import urlparse

        hostname = urlparse(get_base_url()).hostname
        return hostname in {"localhost", "127.0.0.1"}
    except Exception:
        return False


def write_line(message: str = "") -> None:
    print(message)


def color(text: Any, *tokens: str) -> str:
    value = str(text)
    if not COLOR_ENABLED:
        return value
    prefix = "".join(STYLES.get(token, "") for token in tokens)
    return f"{prefix}{value}{STYLES['reset']}"


def strip_ansi(value: str) -> str:
    return re.sub(r"\033\[[0-9;]*m", "", str(value))


def visible_length(value: str) -> int:
    return len(strip_ansi(value))


def pad_visible(value: str, width: int) -> str:
    return f"{value}{' ' * max(0, width - visible_length(value))}"


def brand_title(title: str = "CheFu Academy SDK") -> str:
    return color(title, "bold", "cyan")


def print_header(title: str, subtitle: str | None = None) -> None:
    write_line()
    write_line(brand_title(title))
    if subtitle:
        write_line(color(subtitle, "dim"))
    write_line(color("-" * max(28, visible_length(title)), "gray"))


def print_panel(title: str, lines: list[str] | None = None) -> None:
    normalized = [str(line) for line in (lines or [])]
    width = max([visible_length(title), *[visible_length(line) for line in normalized], 24])
    border = f"+-{'-' * width}-+"

    write_line(color(border, "cyan"))
    write_line(f"{color('|', 'cyan')} {pad_visible(color(title, 'bold'), width)} {color('|', 'cyan')}")
    if normalized:
        write_line(color(border, "cyan"))
        for line in normalized:
            write_line(f"{color('|', 'cyan')} {pad_visible(line, width)} {color('|', 'cyan')}")
    write_line(color(border, "cyan"))


def print_success(message: str, lines: list[str] | None = None) -> None:
    print_panel(color("Success", "green"), [message, *(lines or [])])


def print_warning(message: str, lines: list[str] | None = None) -> None:
    print_panel(color("Notice", "yellow"), [message, *(lines or [])])


def print_table(headers: list[str], rows: list[list[str]]) -> None:
    widths = [
        max(visible_length(header), *[visible_length(row[index] or "") for row in rows])
        for index, header in enumerate(headers)
    ]
    divider = "-+-".join("-" * width for width in widths)

    write_line(
        " | ".join(
            pad_visible(color(header, "bold", "cyan"), widths[index])
            for index, header in enumerate(headers)
        )
    )
    write_line(color(divider, "gray"))
    for row in rows:
        write_line(
            " | ".join(
                pad_visible(row[index] or "", widths[index])
                for index in range(len(headers))
            )
        )


def ask(question: str) -> str:
    return input(question).strip()


def ask_password(question: str) -> str:
    if not sys.stdin.isatty() or not sys.stdout.isatty():
        return ask(question)

    if os.name == "nt":
        return _ask_password_windows(question)

    return _ask_password_posix(question)


def _ask_password_windows(question: str) -> str:
    import msvcrt

    value: list[str] = []
    sys.stdout.write(question)
    sys.stdout.flush()

    while True:
        char = msvcrt.getwch()
        if char in {"\r", "\n"}:
            sys.stdout.write("\n")
            return "".join(value)
        if char == "\003":
            sys.stdout.write("\n")
            raise KeyboardInterrupt
        if char == "\b":
            if value:
                value.pop()
                sys.stdout.write("\b \b")
                sys.stdout.flush()
            continue
        if char == "\x00":
            msvcrt.getwch()
            continue
        value.append(char)
        sys.stdout.write("*")
        sys.stdout.flush()


def _ask_password_posix(question: str) -> str:
    import termios
    import tty

    value: list[str] = []
    fd = sys.stdin.fileno()
    previous = termios.tcgetattr(fd)
    sys.stdout.write(question)
    sys.stdout.flush()

    try:
        tty.setraw(fd)
        while True:
            char = sys.stdin.read(1)
            if char in {"\r", "\n"}:
                sys.stdout.write("\n")
                return "".join(value)
            if char == "\x03":
                sys.stdout.write("\n")
                raise KeyboardInterrupt
            if char in {"\x7f", "\b"}:
                if value:
                    value.pop()
                    sys.stdout.write("\b \b")
                    sys.stdout.flush()
                continue
            if not char:
                continue
            value.append(char)
            sys.stdout.write("*")
            sys.stdout.flush()
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, previous)


def ask_menu(message: str, options: list[dict[str, str]]) -> str:
    write_line(color(message, "bold", "cyan"))
    for index, option in enumerate(options, start=1):
        write_line(f"{color(index, 'cyan')}. {option['label']}")

    selected = ask(color(f"Select 1-{len(options)}: ", "cyan"))
    try:
        selected_index = int(selected) - 1
        return options[selected_index]["value"]
    except (ValueError, IndexError):
        return options[-1]["value"]


def parse_option(argv: list[str], long_name: str, short_name: str | None = None) -> str:
    long_equals = f"--{long_name}="
    for item in argv:
        if item.startswith(long_equals):
            return item[len(long_equals) :]

    long_flag = f"--{long_name}"
    if long_flag in argv:
        index = argv.index(long_flag)
        if index + 1 < len(argv):
            return argv[index + 1]

    if short_name:
        short_flag = f"-{short_name}"
        if short_flag in argv:
            index = argv.index(short_flag)
            if index + 1 < len(argv):
                return argv[index + 1]

    return ""


def has_flag(argv: list[str], long_name: str, short_name: str | None = None) -> bool:
    return f"--{long_name}" in argv or bool(short_name and f"-{short_name}" in argv)


def api_request(
    pathname: str,
    *,
    method: str = "GET",
    body: dict[str, Any] | None = None,
    token: str | None = None,
    friendly: bool = False,
) -> Any:
    url = f"{get_base_url()}{pathname}"
    headers = {"Accept": "application/json"}
    data = None

    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")

    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = urllib.request.Request(url, method=method.upper(), headers=headers, data=data)

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8")
        details = _parse_json(raw) or {}
        message = _extract_error_message(details) or raw or "Request failed."
        if friendly:
            raise friendly_http_error(pathname, error.code, message) from error
        raise CheFuCliError(message, [f"Status code: {error.code}", "Please try again."], error.code) from error
    except urllib.error.URLError as error:
        raise CheFuCliError(
            "Could not reach the CheFu Academy API.",
            [
                "Check your internet connection.",
                f"Make sure the API URL is correct: {get_base_url()}",
                *(
                    ["Make sure your local CheFu Inc backend is running."]
                    if is_local_api_url()
                    else ["Try again in a few minutes."]
                ),
            ],
        ) from error


def request(pathname: str, body: dict[str, Any]) -> Any:
    return api_request(pathname, method="POST", body=body, friendly=True)


def friendly_http_error(pathname: str, status_code: int, server_message: str) -> CheFuCliError:
    is_login = "/auth/login" in pathname
    is_register = "/auth/register" in pathname
    command = "chefu-academy"

    if status_code == 401 and is_login:
        return CheFuCliError(
            "We could not sign you in. The email or password looks incorrect.",
            [
                f'Check the email and password, then run "{command} login" again.',
                f'If you do not have an account yet, run "{command} register".',
            ],
        )

    if status_code == 401 and "/keys/" in pathname:
        return CheFuCliError(
            "Your CheFu Academy login session cannot manage API keys yet.",
            [
                f'Run "{command} logout", then run "{command} login" again.',
                "If this keeps happening, the CheFu API needs the latest auth refresh deployment.",
            ],
            401,
        )

    if status_code == 409 and is_register:
        return CheFuCliError(
            "That email already has a CheFu Academy account.",
            [
                f'Run "{command} login" instead.',
                "Use a different email if you want to create a new account.",
            ],
        )

    if status_code == 422:
        return CheFuCliError(
            "Some account details need a quick fix.",
            [
                server_message,
                "Passwords must be at least 6 characters.",
                "Run the command again when you are ready.",
            ],
        )

    if status_code == 429:
        return CheFuCliError(
            "Too many attempts. Please wait a little before trying again.",
            ["Try again in a few minutes."],
        )

    if status_code >= 500 and (is_login or is_register):
        return CheFuCliError(
            "CheFu Academy account setup is temporarily unavailable.",
            [
                "Please try again in a few minutes.",
                *(
                    [
                        "Make sure your local CheFu Inc backend is running.",
                        "Make sure the backend has Firebase auth configured.",
                    ]
                    if is_local_api_url()
                    else [
                        "If this keeps happening, contact CheFu support and mention that SDK login returned a server error."
                    ]
                ),
            ],
        )

    if status_code == 404:
        return CheFuCliError(
            "The CheFu Academy auth endpoint was not found.",
            [
                f"Current API URL: {get_base_url()}",
                *(
                    ["Make sure your local CheFu Inc backend is running on that URL."]
                    if is_local_api_url()
                    else ["Please update the SDK or try again later."]
                ),
            ],
        )

    return CheFuCliError(
        server_message or "CheFu Academy request failed.",
        [f"Status code: {status_code}", "Please try again."],
        status_code,
    )


def save_session(session: dict[str, Any]) -> None:
    expires_in = int(session.get("expiresIn") or 0)
    expires_at = (
        (dt.datetime.now(dt.timezone.utc) + dt.timedelta(seconds=expires_in)).isoformat()
        if expires_in
        else session.get("expiresAt")
    )

    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "baseURL": get_base_url(),
        "token": session.get("idToken") or session.get("token"),
        "idToken": session.get("idToken") or session.get("token"),
        "refreshToken": session.get("refreshToken") or "",
        "expiresAt": expires_at,
        "user": session.get("user"),
        "savedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
    }
    CONFIG_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    try:
        CONFIG_FILE.chmod(0o600)
    except OSError:
        pass


def read_session() -> dict[str, Any] | None:
    if not CONFIG_FILE.exists():
        return None

    try:
        return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def delete_session() -> None:
    try:
        CONFIG_FILE.unlink()
    except FileNotFoundError:
        pass


def decode_jwt_payload(token: str | None) -> dict[str, Any] | None:
    if not token:
        return None

    parts = token.split(".")
    if len(parts) < 2:
        return None

    try:
        padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
        decoded = base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8")
        return json.loads(decoded)
    except Exception:
        return None


def is_firebase_id_token(token: str | None) -> bool:
    payload = decode_jwt_payload(token)
    return bool(
        isinstance(payload, dict)
        and isinstance(payload.get("iss"), str)
        and payload["iss"].startswith("https://securetoken.google.com/")
        and isinstance(payload.get("aud"), str)
    )


def session_expires_soon(session: dict[str, Any] | None) -> bool:
    if not session:
        return False

    expires_at = _parse_datetime(session.get("expiresAt"))
    if not expires_at:
        return bool(session.get("refreshToken"))

    return expires_at <= dt.datetime.now(dt.timezone.utc) + dt.timedelta(
        seconds=TOKEN_REFRESH_BUFFER_SECONDS
    )


def refresh_session(session: dict[str, Any]) -> dict[str, Any]:
    refresh_token = session.get("refreshToken")
    if not refresh_token:
        raise CheFuCliError(
            "Your CheFu Academy login session has expired.",
            ['Run "chefu-academy login" again.'],
        )

    refreshed = api_request(
        "/auth/refresh",
        method="POST",
        body={"refreshToken": refresh_token},
        friendly=True,
    )
    next_session = {**session, **(refreshed or {}), "user": session.get("user")}
    save_session(next_session)
    return read_session() or next_session


def require_session() -> dict[str, Any]:
    session = read_session()

    if not session or not (session.get("token") or session.get("idToken")):
        raise CheFuCliError(
            "You are not logged in to CheFu Academy.",
            ['Run "chefu-academy login" first.'],
        )

    token = session.get("idToken") or session.get("token")
    if not is_firebase_id_token(token):
        if session.get("refreshToken"):
            session = refresh_session(session)
        else:
            raise CheFuCliError(
                "Your saved CheFu Academy session is from an older login format.",
                [
                    'Run "chefu-academy logout".',
                    'Run "chefu-academy login" again after the latest backend is deployed.',
                ],
            )

    if session_expires_soon(session):
        session = refresh_session(session)

    return session


def authenticated_request(pathname: str, *, method: str = "GET", body: dict[str, Any] | None = None) -> Any:
    session = require_session()

    try:
        return api_request(
            pathname,
            method=method,
            body=body,
            token=session.get("idToken") or session.get("token"),
        )
    except CheFuCliError as error:
        if error.status_code == 401 and session.get("refreshToken"):
            session = refresh_session(session)
            return api_request(
                pathname,
                method=method,
                body=body,
                token=session.get("idToken") or session.get("token"),
            )
        raise


def login() -> None:
    print_header("CheFu Academy Login", "Sign in to manage developer API keys.")
    email = ask(color("Email: ", "cyan"))
    password = ask_password(color("Password: ", "cyan"))
    spinner = Spinner("Signing in")

    try:
        session = request("/auth/login", {"email": email, "password": password})
        spinner.succeed()
    except Exception:
        spinner.fail()
        raise

    save_session(session)
    user = session.get("user") or {}
    print_success(f"Logged in as {user.get('email') or email}.", [f"API: {get_base_url()}"])


def register() -> None:
    print_header("Create CheFu Academy Account", "Register a developer account for SDK access.")
    fullname = ask(color("Full name: ", "cyan"))
    email = ask(color("Email: ", "cyan"))
    password = ask_password(color("Password: ", "cyan"))
    spinner = Spinner("Creating account")

    try:
        response = request(
            "/auth/register",
            {"fullname": fullname, "email": email, "password": password},
        )
        spinner.succeed()
    except Exception:
        spinner.fail()
        raise

    print_success((response or {}).get("message") or "Registration successful.", ["You can now log in."])
    login()


def create_key(argv: list[str]) -> None:
    print_header("Create API Key", "Generate a developer key for course and video queries.")
    name = parse_option(argv, "name", "n") or (
        ask(color("Key name: ", "cyan")) if sys.stdin.isatty() else "CLI key"
    )
    spinner = Spinner("Creating API key")

    try:
        response = authenticated_request(
            "/keys/create",
            method="POST",
            body={"name": name},
        )
        spinner.succeed()
    except Exception:
        spinner.fail()
        raise

    print_panel(
        color("API key created", "green"),
        [
            "Save this key now. It will not be shown again.",
            "",
            color("API key:", "bold"),
            response.get("apiKey", ""),
            "",
            f"{color('Public ID:', 'bold')} {response.get('publicId', '')}",
        ],
    )


def list_keys() -> None:
    print_header("API Keys", "Developer keys linked to your CheFu Academy account.")
    spinner = Spinner("Loading API keys")

    try:
        keys = authenticated_request("/keys/list", method="GET")
        spinner.succeed()
    except Exception:
        spinner.fail()
        raise

    if not isinstance(keys, list) or not keys:
        print_warning(
            "No API keys found.",
            ['Create one with: chefu-academy keys create --name "Local development"'],
        )
        return

    print_table(
        ["ID", "Status", "Name", "Last used"],
        [
            [
                color(key.get("id") or key.get("publicId") or "", "cyan"),
                color("active", "green") if key.get("active") else color("revoked", "red"),
                key.get("name") or "Untitled key",
                format_value(key.get("lastUsedAt")) if key.get("lastUsedAt") else color("never", "dim"),
            ]
            for key in keys
        ],
    )


def revoke_key(key_id: str | None, argv: list[str]) -> None:
    if not key_id:
        raise CheFuCliError(
            "API key ID is required.",
            [
                'Run "chefu-academy keys list" to find the key ID.',
                'Then run "chefu-academy keys revoke <keyId>".',
            ],
        )

    if not has_flag(argv, "yes", "y"):
        answer = ask(color(f'Revoke API key {key_id}? Type "yes" to confirm: ', "yellow"))
        if answer.lower() != "yes":
            print_warning("Cancelled.")
            return

    spinner = Spinner("Revoking API key")
    try:
        authenticated_request("/keys/revoke", method="POST", body={"keyId": key_id})
        spinner.succeed()
    except Exception:
        spinner.fail()
        raise

    print_success(f"Revoked API key {key_id}.")


def run_keys_command(argv: list[str]) -> None:
    subcommand = argv[0] if argv else "list"

    if subcommand == "create":
        create_key(argv[1:])
        return

    if subcommand == "list":
        list_keys()
        return

    if subcommand == "revoke":
        revoke_key(argv[1] if len(argv) > 1 else None, argv[2:])
        return

    write_line("Usage: chefu-academy keys [create|list|revoke]")


def run_onboarding() -> None:
    print_header("CheFu Academy SDK", "Build with courses, videos, and developer API keys.")
    choice = ask_menu(
        "Choose an account setup option:",
        [
            {"label": "Login", "value": "login"},
            {"label": "Register new account", "value": "register"},
            {"label": "Skip", "value": "skip"},
        ],
    )

    if choice == "login":
        login()
        return

    if choice == "register":
        register()
        return

    write_line(color("Skipped.", "dim"))


def whoami() -> None:
    session = read_session()
    token_payload = decode_jwt_payload((session or {}).get("idToken") or (session or {}).get("token"))
    user = (session or {}).get("user") or {}
    email = user.get("email") or (token_payload or {}).get("email")

    if email:
        print_panel(
            "Current session",
            [
                f"{color('User:', 'bold')} {email}",
                f"{color('API:', 'bold')} {(session or {}).get('baseURL') or get_base_url()}",
            ],
        )
    else:
        print_warning("Not logged in.", ['Run: chefu-academy login'])


def print_usage() -> None:
    print_panel(
        "Usage",
        [
            "chefu-academy auth",
            "chefu-academy login",
            "chefu-academy register",
            "chefu-academy logout",
            "chefu-academy whoami",
            'chefu-academy keys create --name "Local development"',
            "chefu-academy keys list",
            "chefu-academy keys revoke <keyId>",
        ],
    )


def run(argv: list[str] | None = None) -> None:
    args = list(sys.argv[1:] if argv is None else argv)
    command = args[0] if args else "auth"

    if command in {"help", "--help", "-h"}:
        print_usage()
        return

    if command in {"auth", "setup"}:
        run_onboarding()
        return

    if command == "login":
        login()
        return

    if command == "register":
        register()
        return

    if command == "logout":
        delete_session()
        print_success("Logged out.")
        return

    if command == "keys":
        run_keys_command(args[1:])
        return

    if command == "whoami":
        whoami()
        return

    print_usage()


def main() -> None:
    try:
        run()
    except KeyboardInterrupt:
        sys.stderr.write(f"\n{color('Cancelled.', 'yellow')}\n")
        raise SystemExit(130)
    except CheFuCliError as error:
        sys.stderr.write(f"{error.format()}\n")
        raise SystemExit(1)


def _parse_json(value: str) -> Any:
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return None


def _extract_error_message(details: Any) -> str | None:
    if not isinstance(details, dict):
        return None

    message = details.get("message")
    if isinstance(message, list):
        return " ".join(str(item) for item in message)
    if isinstance(message, str):
        return message

    error = details.get("error")
    return error if isinstance(error, str) else None


def _parse_datetime(value: Any) -> dt.datetime | None:
    if not isinstance(value, str) or not value:
        return None

    try:
        normalized = value.replace("Z", "+00:00")
        parsed = dt.datetime.fromisoformat(normalized)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=dt.timezone.utc)
        return parsed.astimezone(dt.timezone.utc)
    except ValueError:
        return None


def format_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, dict) and isinstance(value.get("_seconds"), (int, float)):
        return dt.datetime.fromtimestamp(value["_seconds"], dt.timezone.utc).isoformat()
    return json.dumps(value)


if __name__ == "__main__":
    main()
