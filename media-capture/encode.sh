#!/usr/bin/env bash
# Encodes what capture.mjs records (needs ffmpeg with libwebp and libx264).
#
#   encode.sh webp <in.png> <out.webp> [max-bytes] [width]
#       WebP at quality 85; when the file is larger than max-bytes (default 256000 = 250 KB) the
#       quality goes down in steps to 60, then the image is scaled down to 85, 75 and 67 % at
#       quality 70 (full-screen aerial imagery). Exit 3, and no output file, when it is still too
#       large (crop the shot to the panel that matters). With a width the image is scaled to it.
#
#   encode.sh clip <in.webm> <out.mp4> <start-seconds> <seconds> <poster.png> <poster.webp>
#       Cuts the recording from start-seconds for at most seconds, scales it to 1920x1200 and
#       encodes H.264 (yuv420p, 30 fps, no audio, fast start) for the YouTube upload; the poster
#       PNG becomes a 1920 px wide WebP like a screenshot.
#
# Outputs are written to a temporary file and renamed, so a failed run never leaves half a file.
set -euo pipefail
export LC_ALL=C   # decimal points in printf and awk, whatever the user's locale

die() { printf 'encode.sh: %s\n' "$*" >&2; exit "${2:-1}"; }
command -v ffmpeg >/dev/null || die "ffmpeg not found"

FF=(ffmpeg -hide_banner -loglevel error -nostdin -y)

webp() {
    local in="$1" out="$2" max="${3:-256000}" width="${4:-}" in_w q w tmp size=0 step
    [[ -s "$in" ]] || die "no input $in"
    mkdir -p "$(dirname "$out")"
    tmp="$(mktemp "${out%.webp}.XXXXXX.webp")"
    trap 'rm -f "$tmp"' RETURN
    in_w="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$in")"
    [[ -n "$width" ]] || width="$in_w"
    # Quality first, at full size; then smaller sizes at quality 70 (full-screen aerial images)
    for step in "1 85" "1 80" "1 75" "1 70" "1 65" "1 60" "0.85 70" "0.75 70" "0.67 70"; do
        read -r scale q <<<"$step"
        w=$(awk -v w="$width" -v s="$scale" 'BEGIN { printf "%d", int(w * s / 2) * 2 }')
        "${FF[@]}" -i "$in" -vf "scale=${w}:-2:flags=lanczos" -c:v libwebp -quality "$q" -compression_level 6 \
            -preset picture -frames:v 1 "$tmp"
        size=$(stat -c %s "$tmp")
        if (( size <= max )); then
            chmod 644 "$tmp"
            mv -f "$tmp" "$out"
            printf 'webp %s %dpx q%s %d KB%s\n' "$out" "$w" "$q" $(( size / 1024 )) \
                "$( [[ "$scale" != 1 ]] && printf ' (scaled down to fit %d KB: crop the shot to keep full resolution)' $(( max / 1024 )) )"
            return 0
        fi
    done
    die "$out is $(( size / 1024 )) KB even at $w px (limit $(( max / 1024 )) KB): crop the shot" 3
}

clip() {
    local in="$1" out="$2" start="$3" secs="$4" poster_png="$5" poster_webp="$6" tmp
    [[ -s "$in" ]] || die "no recording $in"
    mkdir -p "$(dirname "$out")"
    tmp="$(mktemp "${out%.mp4}.XXXXXX.mp4")"
    trap 'rm -f "$tmp"' RETURN
    "${FF[@]}" -ss "$start" -i "$in" -t "$secs" -an \
        -vf "scale=1920:1200:force_original_aspect_ratio=decrease:flags=lanczos,pad=1920:1200:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p" \
        -c:v libx264 -preset slow -crf 20 -profile:v high -movflags +faststart "$tmp"
    chmod 644 "$tmp"
    mv -f "$tmp" "$out"
    printf 'mp4 %s %.1f s %d KB\n' "$out" "$secs" $(( $(stat -c %s "$out") / 1024 ))
    webp "$poster_png" "$poster_webp" 256000 1920
}

case "${1:-}" in
    webp) shift; (( $# >= 2 )) || die "usage: encode.sh webp <in.png> <out.webp> [max-bytes] [width]"; webp "$@" ;;
    clip) shift; (( $# == 6 )) || die "usage: encode.sh clip <in.webm> <out.mp4> <start> <seconds> <poster.png> <poster.webp>"; clip "$@" ;;
    *) sed -n '2,14p' "$0"; exit 2 ;;
esac
