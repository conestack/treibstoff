#!/bin/bash
#
# Clean development environment.

set -e

for file in lib64 package-lock.json pyvenv.cfg treibstoff-*; do
    if [ -e "$file" ]; then
        rm "$file"
    fi
done

for dir in bin build bundle dist docs/html include karma lib node_modules share treibstoff.egg-info; do
    if [ -d "$dir" ]; then
        rm -r "$dir"
    fi
done
