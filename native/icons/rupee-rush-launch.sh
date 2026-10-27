#!/bin/sh
# Portable launch: execute the native binary beside this script.
set -eu
CDPATH="" cd -- "$(dirname -- "$0")"
exec ./RupeeRushNative "$@"
