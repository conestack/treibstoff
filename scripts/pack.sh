#!/bin/bash
#
# Create npm package.

set -e

make rollup

mkdir -p ./bundle
rm -f ./bundle/*
cp treibstoff/bundle/* ./bundle/

npm pack
