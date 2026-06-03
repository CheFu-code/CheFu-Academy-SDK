#!/usr/bin/env sh
set -eu

BASE_URL="${CHEFU_API_BASE_URL:-https://api.chefuinc.com/api}"
BASE_URL="${BASE_URL%/}"

require_api_key() {
  : "${CHEFU_API_KEY:?Set CHEFU_API_KEY before running this command.}"
}

request() {
  method="$1"
  path="$2"
  body="${3:-}"
  if [ "$#" -ge 4 ]; then
    token="$4"
  else
    token="${CHEFU_API_KEY:-}"
  fi

  if [ -n "$body" ]; then
    if [ -n "$token" ]; then
      curl --fail --silent --show-error \
        --request "$method" \
        --header "Accept: application/json" \
        --header "Authorization: Bearer $token" \
        --header "Content-Type: application/json" \
        --data "$body" \
        "$BASE_URL$path"
    else
      curl --fail --silent --show-error \
        --request "$method" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --data "$body" \
        "$BASE_URL$path"
    fi
    return
  fi

  if [ -n "$token" ]; then
    curl --fail --silent --show-error \
      --request "$method" \
      --header "Accept: application/json" \
      --header "Authorization: Bearer $token" \
      "$BASE_URL$path"
  else
    curl --fail --silent --show-error \
      --request "$method" \
      --header "Accept: application/json" \
      "$BASE_URL$path"
  fi
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

usage() {
  cat <<'EOF'
Usage:
  chefu-academy.sh courses list [limit]
  chefu-academy.sh courses search <query> [limit]
  chefu-academy.sh courses get <courseId>
  chefu-academy.sh videos list [limit]
  chefu-academy.sh videos search <query> [limit]
  chefu-academy.sh videos get <videoId>
  chefu-academy.sh auth login <email> <password>
  chefu-academy.sh keys list <idToken>
  chefu-academy.sh keys create <idToken> [name]
  chefu-academy.sh keys revoke <idToken> <keyId>
EOF
}

command="${1:-}"
subcommand="${2:-}"

case "$command:$subcommand" in
  courses:list)
    require_api_key
    limit="${3:-20}"
    request GET "/courses?limit=$limit"
    ;;
  courses:search)
    require_api_key
    query="${3:-}"
    limit="${4:-20}"
    request GET "/courses/search?query=$(printf '%s' "$query" | sed 's/ /%20/g')&limit=$limit"
    ;;
  courses:get)
    require_api_key
    course_id="${3:?Course ID is required.}"
    request GET "/courses/$course_id"
    ;;
  videos:list)
    require_api_key
    limit="${3:-20}"
    request GET "/videos?limit=$limit"
    ;;
  videos:search)
    require_api_key
    query="${3:-}"
    limit="${4:-20}"
    request GET "/videos/search?query=$(printf '%s' "$query" | sed 's/ /%20/g')&limit=$limit"
    ;;
  videos:get)
    require_api_key
    video_id="${3:?Video ID is required.}"
    request GET "/videos/$video_id"
    ;;
  auth:login)
    email="${3:?Email is required.}"
    password="${4:?Password is required.}"
    email_json="$(json_escape "$email")"
    password_json="$(json_escape "$password")"
    request POST "/auth/login" "{\"email\":\"$email_json\",\"password\":\"$password_json\"}" ""
    ;;
  keys:list)
    token="${3:?ID token is required.}"
    request GET "/keys/list" "" "$token"
    ;;
  keys:create)
    token="${3:?ID token is required.}"
    name="${4:-CLI key}"
    name_json="$(json_escape "$name")"
    request POST "/keys/create" "{\"name\":\"$name_json\"}" "$token"
    ;;
  keys:revoke)
    token="${3:?ID token is required.}"
    key_id="${4:?Key ID is required.}"
    key_id_json="$(json_escape "$key_id")"
    request POST "/keys/revoke" "{\"keyId\":\"$key_id_json\"}" "$token"
    ;;
  *)
    usage
    exit 1
    ;;
esac
