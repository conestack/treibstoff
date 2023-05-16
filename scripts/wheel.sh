#!/bin/bash

set -e

rm -rf ./build

make rollup
python3 setup.py bdist_wheel
