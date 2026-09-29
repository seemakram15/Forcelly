#!/usr/bin/env bash
set -euo pipefail

AVD="Forcelly_Pixel9"
PACKAGE="com.forcelly.app"
APK="android/app/build/outputs/apk/debug/app-debug.apk"
EMULATOR_BIN="$ANDROID_HOME/emulator/emulator"

# ── 1. Start emulator if not already running ─────────────────────────────────
if ! adb devices | grep -q "emulator"; then
  echo "▶ Starting emulator $AVD..."
  "$EMULATOR_BIN" -avd "$AVD" -no-snapshot-save &
  EMULATOR_PID=$!

  echo "⏳ Waiting for emulator to boot..."
  adb wait-for-device
  until adb shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; do
    sleep 2
  done
  echo "✓ Emulator booted"
else
  echo "✓ Emulator already running"
fi

# ── 2. Build APK ─────────────────────────────────────────────────────────────
echo "🔨 Building APK..."

# Export JS bundle into assets (embedded, no Metro needed)
rm -rf /tmp/forcelly-export
NODE_ENV=production npx expo export --platform android --output-dir /tmp/forcelly-export

mkdir -p android/app/src/main/assets
HBC=$(find /tmp/forcelly-export -name "*.hbc" | head -1)
if [ -z "$HBC" ]; then
  echo "❌ No .hbc bundle found in export output"
  exit 1
fi
cp "$HBC" android/app/src/main/assets/index.android.bundle
echo "✓ Bundle embedded"

# Wipe only the incremental packaging state (avoids the ninja-clean CMake crash)
rm -rf android/app/build/intermediates/incremental
rm -rf android/app/build/outputs
(cd android && ./gradlew assembleDebug 2>&1 | tail -80)
echo "✓ APK built: $APK"

# ── 3. Uninstall old version ─────────────────────────────────────────────────
echo "🗑  Uninstalling old app..."
adb uninstall "$PACKAGE" 2>/dev/null || echo "  (not installed, skipping)"

# ── 4. Install new APK ───────────────────────────────────────────────────────
echo "📦 Installing APK..."
adb install "$APK"
echo "✓ Installed"

# ── 5. Launch ────────────────────────────────────────────────────────────────
echo "🚀 Launching app..."
adb shell am start -n "$PACKAGE/.MainActivity"
echo "✓ Done"
