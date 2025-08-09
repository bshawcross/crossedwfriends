#!/bin/bash
# Apply a .patch or .diff file to the current branch

if [ -z "$1" ]; then
  echo "Usage: $0 path/to/patch.diff"
  exit 1
fi

patch_file="$1"

if [ ! -f "$patch_file" ]; then
  echo "Error: file '$patch_file' not found!"
  exit 1
fi

git apply "$patch_file" && echo "✅ Patch applied successfully" || echo "❌ Failed to apply patch"


