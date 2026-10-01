#!/usr/bin/env bash
# Fails unless the real Android app fetches a default subtitle track and each
# default favorite translation from YouTube timedtext, in that order.
# Signals checked in logcat:
#   [APP_READY]          printed by src/client.tsx once the React root has rendered content
#   [APP_BOOT_ERROR]     printed by src/client.tsx on an uncaught boot error
#   FATAL EXCEPTION      native crash of com.ytviewer.app
#   WebView error loading https://appassets...   / Asset not found   → bundled files missing
set -uo pipefail

PACKAGE_NAME="${PACKAGE_NAME:-com.ytviewer.app}"
TIMEOUT_S="${APP_READY_TIMEOUT:-45}"
SUBTITLE_FETCH_TIMEOUT_S="${SUBTITLE_FETCH_TIMEOUT:-150}"
LOGCAT_OUT="${LOGCAT_OUT:-./android-emulator-logcat.txt}"
DEFAULT_CAPTION_PATTERN='SUBTITLE_FETCH kind=default http=2[0-9][0-9] bytes=[1-9][0-9]* cues=[1-9][0-9]*'
HEBREW_CAPTION_PATTERN='SUBTITLE_FETCH kind=translated lang=he http=2[0-9][0-9] bytes=[1-9][0-9]* cues=[1-9][0-9]*'
ITALIAN_CAPTION_PATTERN='SUBTITLE_FETCH kind=translated lang=it http=2[0-9][0-9] bytes=[1-9][0-9]* cues=[1-9][0-9]*'
READY_AT=-1
PLAYER_STARTED=false

fail() {
  echo "❌ ANDROID E2E FAILED: $1"
  adb logcat -d > "${LOGCAT_OUT}" 2>/dev/null || true
  grep -E "APP_READY|APP_BOOT_ERROR|FATAL EXCEPTION|WebView error|Asset not found|WebViewConsole|YT_CAPTION_INTERCEPTOR|SUBTITLE_FETCH" "${LOGCAT_OUT}" | tail -n 60 || true
  exit 1
}

for ((i = 0; i < TIMEOUT_S + SUBTITLE_FETCH_TIMEOUT_S; i++)); do
  LOG=$(adb logcat -d 2>/dev/null || true)
  if echo "${LOG}" | grep -q "FATAL EXCEPTION"; then fail "app crashed (FATAL EXCEPTION)"; fi
  if echo "${LOG}" | grep -q "APP_BOOT_ERROR"; then fail "web app threw during startup"; fi
  if echo "${LOG}" | grep -qE "WebView error loading https://appassets|Asset not found"; then
    fail "bundled web files could not be loaded"
  fi
  if ! echo "${LOG}" | grep -q "APP_READY"; then
    if (( i >= TIMEOUT_S )); then fail "UI never rendered within ${TIMEOUT_S}s (no [APP_READY] in logcat)"; fi
    sleep 1
    continue
  fi
  adb shell pidof "${PACKAGE_NAME}" >/dev/null 2>&1 || fail "app process is not running"
  if (( READY_AT < 0 )); then READY_AT=$i; fi
  if [[ "${PLAYER_STARTED}" != true ]]; then
    adb shell input tap 450 320 || fail "could not start YouTube playback on the emulator"
    PLAYER_STARTED=true
  fi

  DEFAULT_LINE=$(printf '%s\n' "${LOG}" | grep -nE "${DEFAULT_CAPTION_PATTERN}" | head -n 1 | cut -d: -f1 || true)
  HEBREW_LINE=$(printf '%s\n' "${LOG}" | grep -nE "${HEBREW_CAPTION_PATTERN}" | head -n 1 | cut -d: -f1 || true)
  ITALIAN_LINE=$(printf '%s\n' "${LOG}" | grep -nE "${ITALIAN_CAPTION_PATTERN}" | head -n 1 | cut -d: -f1 || true)
  if [[ -n "${DEFAULT_LINE}" && -n "${HEBREW_LINE}" && -n "${ITALIAN_LINE}" ]]; then
    if (( DEFAULT_LINE < HEBREW_LINE && HEBREW_LINE < ITALIAN_LINE )); then
      echo "${LOG}" > "${LOGCAT_OUT}"
      echo "✅ Real default subtitles and Hebrew/Italian favorite subtitles fetched successfully, in order."
      grep -E "SUBTITLE_FETCH" "${LOGCAT_OUT}" | tail -n 20
      exit 0
    fi
    fail "favorite subtitle responses did not follow the successful default subtitle response"
  fi
  if (( i - READY_AT >= SUBTITLE_FETCH_TIMEOUT_S )); then
    fail "timed out waiting for successful default, Hebrew, and Italian subtitle responses after [APP_READY]"
  fi
  sleep 1
done

fail "Android app readiness and live subtitle fetch exceeded the combined timeout"
