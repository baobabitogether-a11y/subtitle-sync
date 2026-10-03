#!/usr/bin/env bash
# Fails (exit 1) unless the Android app actually rendered its web UI.
# Signals checked in logcat:
#   [APP_READY]          printed by src/client.tsx once the React root has rendered content
#   [APP_BOOT_ERROR]     printed by src/client.tsx on an uncaught boot error
#   FATAL EXCEPTION      native crash of com.ytviewer.app
#   WebView error loading https://appassets...   / Asset not found   → bundled files missing
set -uo pipefail

PACKAGE_NAME="${PACKAGE_NAME:-com.ytviewer.app}"
TIMEOUT_S="${APP_READY_TIMEOUT:-45}"
LOGCAT_OUT="${LOGCAT_OUT:-./android-emulator-logcat.txt}"

fail() {
  echo "❌ ANDROID E2E FAILED: $1"
  adb logcat -d > "${LOGCAT_OUT}" 2>/dev/null || true
  grep -E "APP_READY|APP_BOOT_ERROR|FATAL EXCEPTION|WebView error|Asset not found|WebViewConsole|YT_CAPTION_INTERCEPTOR" "${LOGCAT_OUT}" | tail -n 40 || true
  exit 1
}

for ((i = 0; i < TIMEOUT_S; i++)); do
  LOG=$(adb logcat -d 2>/dev/null || true)
  if echo "${LOG}" | grep -q "FATAL EXCEPTION"; then fail "app crashed (FATAL EXCEPTION)"; fi
  if echo "${LOG}" | grep -q "APP_BOOT_ERROR"; then fail "web app threw during startup"; fi
  if echo "${LOG}" | grep -qE "WebView error loading https://appassets|Asset not found"; then
    fail "bundled web files could not be loaded"
  fi
  if echo "${LOG}" | grep -q "APP_READY"; then
    adb shell pidof "${PACKAGE_NAME}" >/dev/null 2>&1 || fail "app process is not running"
    echo "${LOG}" > "${LOGCAT_OUT}"
    echo "✅ Android app rendered its UI ([APP_READY] seen after ${i}s)"
    exit 0
  fi
  sleep 1
done

fail "UI never rendered within ${TIMEOUT_S}s (no [APP_READY] in logcat)"
