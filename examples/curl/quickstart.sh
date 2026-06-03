#!/usr/bin/env sh
set -eu

: "${CHEFU_API_KEY:?Set CHEFU_API_KEY before running this example.}"

BASE_URL="${CHEFU_API_BASE_URL:-https://api.chefuinc.com/api}"
BASE_URL="${BASE_URL%/}"

curl --fail --silent --show-error \
  --header "Authorization: Bearer ${CHEFU_API_KEY}" \
  --header "Accept: application/json" \
  "${BASE_URL}/courses?limit=5"
