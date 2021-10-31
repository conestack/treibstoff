#!/bin/bash
#
# Clean development environment.

set -e

to_remove=(
    bin build bundle dist docs/html include karma lib64 lib node_modules
    package-lock.json pyvenv.cfg share treibstoff-* treibstoff.egg-info
)

for item in "${to_remove[@]}"; do
    if [ -e "$item" ]; then
        rm -r "$item"
    fi
done
