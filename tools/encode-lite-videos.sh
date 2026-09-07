#!/usr/bin/env bash
# Generate mobile lite video encodes (≤1280w) from source library.
# 
# B6 requirement: Mobile tier receives smaller encodes selected by motionPolicy.
# This script reads from the source library and outputs to public/video/lite/
# 
# Prerequisites:
#   - ffmpeg installed and on PATH
#   - Source library at documented path (read-only)
#
# Usage:
#   ./tools/encode-lite-videos.sh [--force] [--slug SLUG]
#
# Options:
#   --force       Re-encode even if output exists
#   --slug SLUG   Encode only the specified slug (e.g., hero, colors, design)
#
# ဖွဲ့စည်းပုံ - မိုဘိုင်းအတွက် ပေါ့ပါးသော ဗီဒီယို များကို ထုတ်လုပ်ခြင်း

set -euo pipefail

SOURCE_DIR="../source-media"  # Adjust to your source library path
OUTPUT_DIR="public/video/lite"
MAX_WIDTH=1280
CRF=22  # Slightly higher CRF for smaller files while maintaining quality

FORCE=false
SINGLE_SLUG=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --force)
      FORCE=true
      shift
      ;;
    --slug)
      SINGLE_SLUG="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Clip slugs to encode - add all clips used by LazyVideo and Hero
CLIPS=(
  "hero"
  "colors"
  "design"
  "dynamic-island"
  "camera-sensor"
  "camera-penetration"
  "aperture"
  "c2-modem"
  "battery"
  "ultra-transition"
  "thickness"
  "ultra-touch"
)

encode_clip() {
  local slug=$1
  local input="${SOURCE_DIR}/${slug}-no-audio.mp4"
  local output="${OUTPUT_DIR}/${slug}.mp4"

  # Check if source exists
  if [[ ! -f "$input" ]]; then
    echo "⚠️  Source not found: $input (skipping)"
    return
  fi

  # Skip if output exists and --force not set
  if [[ -f "$output" && "$FORCE" = false ]]; then
    echo "✓ Already exists: $slug (use --force to re-encode)"
    return
  fi

  echo "→ Encoding: $slug (max width ${MAX_WIDTH}px, CRF ${CRF})"

  ffmpeg -i "$input" \
    -vf "scale='min(${MAX_WIDTH},iw)':'-2'" \
    -c:v libx264 \
    -crf "$CRF" \
    -preset slow \
    -profile:v high \
    -level 4.1 \
    -movflags +faststart \
    -an \
    -y \
    "$output" 2>&1 | grep -E "frame=|error" || true

  if [[ -f "$output" ]]; then
    local size=$(du -h "$output" | cut -f1)
    echo "✓ Complete: $slug ($size)"
  else
    echo "✗ Failed: $slug"
  fi
}

echo "=================================================="
echo "Mobile Lite Video Encoder (B6 Implementation)"
echo "Max width: ${MAX_WIDTH}px | CRF: ${CRF}"
echo "=================================================="
echo ""

if [[ -n "$SINGLE_SLUG" ]]; then
  encode_clip "$SINGLE_SLUG"
else
  for slug in "${CLIPS[@]}"; do
    encode_clip "$slug"
  done
fi

echo ""
echo "=================================================="
echo "Encoding complete!"
echo "Verify outputs: ls -lh $OUTPUT_DIR"
echo "=================================================="
