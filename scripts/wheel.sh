#!/bin/bash

set -e

rm -rf ./build

./scripts/rollup.sh
python setup.py bdist_wheel
