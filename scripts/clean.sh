#!/bin/bash
#
# Clean development environment.

set -e

for file in lib64 package-json.lock pyvenv.cfg treibstoff-*; do
    if [ -e "$file" ]; then
        rm "$file"
    fi
done

for dir in bin build bundle dist include karma lib node_modules share; do
    if [ -d "$dir" ]; then
        rm -r "$dir"
    fi
done
