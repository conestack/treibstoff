#!/bin/bash
#
# Create npm package.

set -e

./scripts/rollup.sh

mkdir -p ./bundle
rm -f ./bundle/*
cp treibstoff/bundle/* ./bundle/

npm pack
