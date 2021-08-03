#!/bin/bash

set -e

rm -rf ./build

./rollup.sh
python setup.py bdist_wheel
