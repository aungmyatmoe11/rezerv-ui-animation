#!/usr/bin/env bash
# Probe rotate.mp4, encode rotate-1280, refresh posters and Duo/fold/Pro frames.
#
# Usage:
#   bash tools/refresh-rotate-media.sh            # everything
#   PHASE=rotate     bash tools/refresh-rotate-media.sh
#   PHASE=quality    bash tools/refresh-rotate-media.sh
#   PHASE=pro-frames bash tools/refresh-rotate-media.sh
#   PHASE=b-lite     bash tools/refresh-rotate-media.sh  # posters 2560 + soft-clip CRF 18/20
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PHASE="${PHASE:-all}"
TRANSFORMED="${TRANSFORMED:-/Users/aungmyatmoe/Downloads/Transformed}"
DUO_YT="${DUO_YT:-/Users/aungmyatmoe/Downloads/iPhone Duo YouTube Video 1080p.mp4}"
mkdir -p output/playwright public/poster

log() { printf '\n== %s ==\n' "$*"; }

need() {
  command -v "$1" >/dev/null || { echo "missing: $1" >&2; exit 1; }
}

need ffmpeg
need ffprobe
need python3

probe_stream() {
  local file=$1
  ffprobe -v error -select_streams v:0 \
    -show_entries stream=width,height,avg_frame_rate,codec_name,nb_frames \
    -show_entries format=duration,size,bit_rate \
    -of default=noprint_wrappers=1 "$file"
}

file_md5() {
  if command -v md5 >/dev/null; then
    md5 -q "$1"
  else
    md5sum "$1" | awk '{print $1}'
  fi
}

# JPEG q~90. ffmpeg mjpeg -q:v 2 is slightly sharper than typical q90.
Q=2
MAX_W=2560

extract_poster() {
  local slug=$1
  local src=$2
  local dest="public/poster/${slug}.jpg"
  if [[ ! -f "$src" ]]; then
    echo "skip poster ${slug}: missing ${src}"
    return
  fi
  local dur
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
  local still
  still=$(python3 -c "print(max(0.2, float('${dur}')*0.35))")
  ffmpeg -y -hide_banner -loglevel error -ss "$still" -i "$src" \
    -frames:v 1 -vf "scale='min(${MAX_W},iw)':-2:flags=lanczos" -q:v "$Q" "$dest"
  echo "poster ${slug} <- ${src} @ ${still}s"
}

extract_frames() {
  local slug=$1
  local src=$2
  local count=$3
  local dest="public/frames/${slug}"
  if [[ ! -f "$src" ]]; then
    echo "skip frames ${slug}: missing ${src}"
    return
  fi
  mkdir -p "$dest"
  rm -f "${dest}"/frame_*.jpg
  local dur
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
  # fps = count/duration yields ~count frames; -frames:v caps leftovers.
  ffmpeg -y -hide_banner -loglevel error -i "$src" \
    -vf "fps=${count}/${dur},scale='min(${MAX_W},iw)':-2:flags=lanczos" \
    -frames:v "$count" -q:v "$Q" "${dest}/frame_%04d.jpg"
  local got
  got=$(python3 -c "from pathlib import Path; print(len(list(Path('${dest}').glob('frame_*.jpg'))))")
  echo "frames ${slug}: ${got} files from ${src} (wanted ${count})"
}

# Q2: Transformed master only when duration (±0.25s) and aspect (exact dims or ≤0.02) match the live clip.
pick_master() {
  local live=$1
  local candidate=${2:-}
  python3 - "$live" "$candidate" <<'PY'
import json, subprocess, sys
from pathlib import Path

live, candidate = sys.argv[1], sys.argv[2]


def probe(path):
    raw = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            path,
        ]
    )
    data = json.loads(raw)
    stream = data["streams"][0]
    return int(stream["width"]), int(stream["height"]), float(data["format"]["duration"])


def fmt(w, h, d):
    return f"{w}x{h} {d:.3f}s"


lw, lh, ld = probe(live)
if not candidate or not Path(candidate).is_file():
    print(f"{live}\tmiss\tlive={fmt(lw, lh, ld)} candidate=absent")
    sys.exit(0)

cw, ch, cd = probe(candidate)
same_px = lw == cw and lh == ch
aspect_ok = same_px or abs((cw / ch) - (lw / lh)) <= 0.02
dur_ok = abs(cd - ld) <= 0.25
if aspect_ok and dur_ok:
    why = "dims" if same_px else "aspect"
    print(f"{candidate}\t{why}\tlive={fmt(lw, lh, ld)} candidate={fmt(cw, ch, cd)}")
else:
    fail = []
    if not aspect_ok:
        fail.append("aspect")
    if not dur_ok:
        fail.append("duration")
    print(f"{live}\t{'+'.join(fail)}\tlive={fmt(lw, lh, ld)} candidate={fmt(cw, ch, cd)}")
PY
}

# B-lite: Transformed when Q2 matches; same-duration taller master is a bottom
# watermark crop (crop=W:H:0:0). Otherwise stay on the live file.
pick_b_lite() {
  local live=$1
  local candidate=${2:-}
  python3 - "$live" "$candidate" <<'PY'
import json, subprocess, sys
from pathlib import Path

live, candidate = sys.argv[1], sys.argv[2]


def probe(path):
    raw = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            path,
        ]
    )
    data = json.loads(raw)
    stream = data["streams"][0]
    return int(stream["width"]), int(stream["height"]), float(data["format"]["duration"])


lw, lh, ld = probe(live)
if not candidate or not Path(candidate).is_file():
    print(f"{live}\tlive\tscale={lw}:{lh}:flags=lanczos")
    sys.exit(0)

cw, ch, cd = probe(candidate)
dur_ok = abs(cd - ld) <= 0.25
same_px = lw == cw and lh == ch
aspect_ok = same_px or abs((cw / ch) - (lw / lh)) <= 0.02
band = (not same_px) and dur_ok and cw == lw and ch > lh and (ch - lh) / ch <= 0.2
if same_px and dur_ok:
    print(f"{candidate}\tdims\tscale={lw}:{lh}:flags=lanczos")
elif aspect_ok and dur_ok:
    print(f"{candidate}\taspect\tscale={lw}:{lh}:flags=lanczos")
elif band:
    print(f"{candidate}\tcrop-top\tcrop={lw}:{lh}:0:0")
else:
    print(f"{live}\tlive\tscale={lw}:{lh}:flags=lanczos")
PY
}

encode_crf() {
  local src=$1
  local dest=$2
  local vf=$3
  local crf=$4
  ffmpeg -y -hide_banner -i "$src" \
    -vf "$vf" \
    -c:v libx264 -crf "$crf" -preset slow -profile:v high -pix_fmt yuv420p \
    -movflags +faststart -an "$dest"
}

encode_b_lite_slug() {
  local slug=$1
  local live=$2
  local candidate=${3:-}
  local line chosen reason vf tmp rest
  local w h
  w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$live")
  h=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$live")
  line=$(pick_b_lite "$live" "$candidate")
  chosen=${line%%$'\t'*}
  rest=${line#*$'\t'}
  reason=${rest%%$'\t'*}
  vf=${rest#*$'\t'}
  printf '%s\t%s\t%s\t%s\n' "$slug" "$chosen" "$reason" "$vf"
  tmp="${live}.tmp.mp4"
  encode_crf "$chosen" "$tmp" "$vf" 18
  mv "$tmp" "$live"
  encode_crf "$live" "${live%.mp4}-1280.mp4" "scale='min(1280,iw)':-2:flags=lanczos" 20
  local ow oh
  ow=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$live")
  oh=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$live")
  if [[ "$ow" != "$w" || "$oh" != "$h" ]]; then
    echo "geometry drift ${slug}: wanted ${w}x${h} got ${ow}x${oh}" >&2
    exit 1
  fi
}

extract_all_posters() {
  extract_poster hero public/video/hero.mp4
  extract_poster colors public/video/colors.mp4
  extract_poster display public/video/display-panel.mp4
  extract_poster pro-vs-promax public/video/pro-vs-promax.mp4
  extract_poster design public/video/design.mp4
  extract_poster dynamic-island public/video/dynamic-island.mp4
  extract_poster camera-sensor public/video/camera-sensor.mp4
  extract_poster camera-penetration public/video/camera-penetration.mp4
  extract_poster aperture public/video/aperture.mp4
  extract_poster a20-pro public/video/a20-pro.mp4
  extract_poster c2-modem public/video/c2-modem.mp4
  extract_poster battery public/video/battery.mp4
  extract_poster duo-transition public/video/rotate.mp4
  extract_poster duo-hero public/video/duo-hero.mp4
  extract_poster fold public/video/fold.mp4
  extract_poster thickness public/video/thickness.mp4
  extract_poster duo-touch public/video/duo-touch.mp4
  extract_poster duo-colors public/video/duo-colors.mp4
}

extract_pro_slug() {
  local slug=$1
  local live=$2
  local count=$3
  local candidate=${4:-}
  local line chosen reason rest
  line=$(pick_master "$live" "$candidate")
  chosen=${line%%$'\t'*}
  rest=${line#*$'\t'}
  reason=${rest%%$'\t'*}
  rest=${rest#*$'\t'}
  printf '%s\t%s\t%s\t%s\n' "$slug" "$chosen" "$reason" "$rest" | tee -a output/playwright/pro-frames-sources.txt
  extract_frames "$slug" "$chosen" "$count"
}

encode_rotate_from_youtube() {
  if [[ ! -f "$DUO_YT" ]]; then
    echo "missing YouTube Duo plate: ${DUO_YT}" >&2
    exit 1
  fi
  log "encode rotate.mp4 from YouTube Duo 1.00s–13.00s CRF 18"
  ffmpeg -y -hide_banner -ss 1.00 -i "$DUO_YT" -t 12.00 \
    -vf "scale=1920:-2:flags=lanczos" \
    -c:v libx264 -crf 18 -preset slow -profile:v high -pix_fmt yuv420p \
    -movflags +faststart -an public/video/rotate.mp4

  log "encode rotate-1280 CRF 20"
  ffmpeg -y -hide_banner -i public/video/rotate.mp4 \
    -vf "scale='min(1280,iw)':-2:flags=lanczos" \
    -c:v libx264 -crf 20 -preset slow -profile:v high -pix_fmt yuv420p \
    -movflags +faststart -an public/video/rotate-1280.mp4
}

if [[ "$PHASE" == "all" || "$PHASE" == "rotate" ]]; then
  encode_rotate_from_youtube
  rotate_src="public/video/rotate.mp4"

  log "rotate files"
  ls -lah public/video/rotate.mp4 public/video/rotate-1280.mp4 2>&1 || true

  log "rotate probe"
  probe_stream "$rotate_src" | tee output/playwright/rotate-probe.txt
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$rotate_src")
  W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$rotate_src")
  H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$rotate_src")
  echo "DURATION=${DUR} WIDTH=${W} HEIGHT=${H}" | tee -a output/playwright/rotate-probe.txt

  log "compare hashes"
  {
    echo "rotate $(file_md5 "$rotate_src") $(wc -c < "$rotate_src")"
    [[ -f public/video/duo-colors.mp4 ]] && echo "duo-colors $(file_md5 public/video/duo-colors.mp4) $(wc -c < public/video/duo-colors.mp4)"
    [[ -f public/video/fold.mp4 ]] && echo "fold $(file_md5 public/video/fold.mp4) $(wc -c < public/video/fold.mp4)"
    [[ -f public/video/duo-hero.mp4 ]] && echo "duo-hero $(file_md5 public/video/duo-hero.mp4) $(wc -c < public/video/duo-hero.mp4)"
  } | tee output/playwright/rotate-hashes.txt

  log "rotate stills"
  ffmpeg -y -hide_banner -loglevel error -ss 0.4 -i "$rotate_src" -frames:v 1 output/playwright/rotate-start.jpg
  MID=$(python3 -c "print(max(0.2, float('${DUR}')*0.5))")
  ffmpeg -y -hide_banner -loglevel error -ss "$MID" -i "$rotate_src" -frames:v 1 output/playwright/rotate-mid.jpg
  ffmpeg -y -hide_banner -loglevel error -sseof -0.4 -i "$rotate_src" -frames:v 1 output/playwright/rotate-end.jpg

  log "duo-transition poster from rotate"
  extract_poster duo-transition "$rotate_src"

  probe_stream public/video/rotate-1280.mp4 | tee output/playwright/rotate-1280-probe.txt
fi

if [[ "$PHASE" == "all" || "$PHASE" == "pro-frames" ]]; then
  log "Pro scrub frames 2560 (Q2 master pick)"
  : > output/playwright/pro-frames-sources.txt
  extract_pro_slug colors public/video/colors.mp4 56 \
    "${TRANSFORMED}/2-colors/three horizontal stand -1-no-audio.mp4"
  extract_pro_slug camera-sensor public/video/camera-sensor.mp4 104 \
    "${TRANSFORMED}/6-camera sensor/camera sensor-no-audio.mp4"
  extract_pro_slug a20-pro public/video/a20-pro.mp4 120 \
    "${TRANSFORMED}/A20 pro/A20 pro-no-audio.mp4"
  extract_pro_slug pro-vs-promax public/video/pro-vs-promax.mp4 48 ""
fi

if [[ "$PHASE" == "b-lite" ]]; then
  log "B-lite CRF 18 natives / CRF 20 1280"
  encode_b_lite_slug thickness public/video/thickness.mp4 \
    "${TRANSFORMED}/iphone-ultra/thickness-no-audio.mp4"
  encode_b_lite_slug design public/video/design.mp4 \
    "${TRANSFORMED}/3-design/iphone 18 design-no-audio.mp4"
  encode_b_lite_slug aperture public/video/aperture.mp4 \
    "${TRANSFORMED}/camera zoom/camera zoom-no-audio.mp4"
  encode_b_lite_slug duo-hero public/video/duo-hero.mp4 \
    "${TRANSFORMED}/iphone-ultra/ultra hero-1-no-audio.mp4"
  encode_b_lite_slug c2-modem public/video/c2-modem.mp4 \
    "${TRANSFORMED}/C2/c2-no-audio.mp4"
  encode_b_lite_slug pro-vs-promax public/video/pro-vs-promax.mp4 ""

  log "site-wide posters 2560 q~90"
  extract_all_posters
fi

if [[ "$PHASE" == "all" || "$PHASE" == "quality" ]]; then
  log "site-wide posters 2560 q~90"
  extract_all_posters

  log "fold / duo-hero / duo-colors frames 2560 q~90"
  extract_frames fold public/video/fold.mp4 120
  extract_frames duo-hero public/video/duo-hero.mp4 100
  extract_frames duo-colors public/video/duo-colors.mp4 64
fi

log "done"
if [[ "$PHASE" == "all" || "$PHASE" == "rotate" ]]; then
  ls -lah public/video/rotate.mp4 public/video/rotate-1280.mp4 \
    public/poster/duo-transition.jpg \
    output/playwright/rotate-*.jpg 2>&1 || true
  python3 - <<'PY'
from pathlib import Path
p = Path("output/playwright/rotate-probe.txt")
print(p.read_text() if p.exists() else "no probe yet")
PY
fi
if [[ "$PHASE" == "all" || "$PHASE" == "pro-frames" ]]; then
  python3 - <<'PY'
from pathlib import Path
src = Path("output/playwright/pro-frames-sources.txt")
print(src.read_text() if src.exists() else "no pro-frames log yet")
PY
fi
