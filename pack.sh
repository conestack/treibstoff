#!/bin/bash

set -e

./rollup.sh

mkdir -p ./bundle
rm -f ./bundle/*
cp treibstoff/bundle/* ./bundle/

npm pack
