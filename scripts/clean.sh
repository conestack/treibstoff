#!/bin/bash
#
# Clean development environment.

set -e

to_remove=(
    bin build bundle dist docs/html include karma lib lib64 node_modules
    package-lock.json pyvenv.cfg share treibstoff-* treibstoff.egg-info
)

for item in "${to_remove[@]}"; do
    if [ -e "$item" ]; then
        rm -r "$item"
    fi
done
