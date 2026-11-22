#!/bin/sh
# Turns the recorded frames (video/frames/<clip>/) into MP4s in video/out/: one clip per section of the game, and
# the full video, all the clips one after another.
#
#   sh video/tools/make-videos.sh            every clip, then the full video
#   sh video/tools/make-videos.sh 13-kitchen just that clip (the full video is left as it is)
set -e
cd "$(dirname "$0")/.."
FPS=30
CLIP_BITRATE=6000000   # clips, for editing: a little more detail
FULL_BITRATE=4000000   # the full video: smaller to share

# Build the encoder once. Some Macs need an SDK that matches their Swift compiler named explicitly: try without one
# first, then each installed SDK, newest first, until one builds.
BIN=tools/.encode
if [ ! -x "$BIN" ] || [ tools/encode.swift -nt "$BIN" ]; then
  if ! swiftc -O tools/encode.swift -o "$BIN" 2>/dev/null; then
    for sdk in $(ls -d /Library/Developer/CommandLineTools/SDKs/MacOSX*.*.sdk 2>/dev/null | sort -rV); do
      swiftc -O tools/encode.swift -o "$BIN" -sdk "$sdk" 2>/dev/null && break
    done
  fi
  [ -x "$BIN" ] || { echo "Could not build tools/encode.swift: is Xcode or the Command Line Tools installed?"; exit 1; }
fi

mkdir -p out/clips
if [ -n "$1" ]; then
  "$BIN" "out/clips/$1.mp4" $FPS $CLIP_BITRATE "frames/$1"
  exit 0
fi
for dir in frames/*/; do
  clip=$(basename "$dir")
  "$BIN" "out/clips/$clip.mp4" $FPS $CLIP_BITRATE "$dir"
done
"$BIN" "out/paatis-recipe-playthrough.mp4" $FPS $FULL_BITRATE frames/*/
