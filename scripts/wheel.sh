#!/bin/bash

set -e

rm -rf ./build

./scripts/rollup.sh
python3 setup.py bdist_wheel
